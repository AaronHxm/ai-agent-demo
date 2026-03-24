package com.cloudedge.netty;

import com.cloudedge.domain.TaskProgress;
import com.cloudedge.protocol.NettyMessage;
import com.cloudedge.service.AgentRegistry;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@ChannelHandler.Sharable
@RequiredArgsConstructor
public class NettyServerHandler extends SimpleChannelInboundHandler<String> {

    private final ObjectMapper objectMapper;
    private final AgentRegistry agentRegistry;
    private final NettyChannelManager channelManager;

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        channelManager.addChannel(ctx.channel());
        log.info("Edge connected: {}", ctx.channel().remoteAddress());
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        String channelId = ctx.channel().id().asShortText();
        agentRegistry.offlineByChannel(channelId);
        channelManager.removeChannel(ctx.channel());
        log.info("Edge disconnected: {}", ctx.channel().remoteAddress());
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String msg) {
        try {
            NettyMessage message = objectMapper.readValue(msg.trim(), NettyMessage.class);
            String type = message.getType();
            String channelId = ctx.channel().id().asShortText();

            switch (type != null ? type : "") {
                case "REGISTER" -> handleRegister(ctx, message, channelId);
                case "HEARTBEAT" -> handleHeartbeat(channelId, message);
                case "PROGRESS_REPORT" -> handleProgressReport(message);
                default -> log.warn("Unknown message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Failed to process message: {}", msg, e);
        }
    }

    private void handleRegister(ChannelHandlerContext ctx, NettyMessage message, String channelId) {
        String agentId = message.getAgentId();
        if (agentId == null || agentId.isBlank()) {
            log.warn("Register message missing agentId");
            return;
        }

        String agentName = agentId;
        String host = ctx.channel().remoteAddress().toString();

        if (message.getPayload() != null) {
            Map<String, Object> payload = objectMapper.convertValue(message.getPayload(), new TypeReference<>() {});
            if (payload.containsKey("agentName")) {
                agentName = String.valueOf(payload.get("agentName"));
            }
            if (payload.containsKey("host")) {
                host = String.valueOf(payload.get("host"));
            }
        }

        agentRegistry.registerViaLongConnection(agentId, agentName, channelId, host);
        log.info("Agent registered via Netty: {} ({})", agentId, agentName);
    }

    private void handleHeartbeat(String channelId, NettyMessage message) {
        agentRegistry.heartbeatByChannel(channelId);
    }

    private void handleProgressReport(NettyMessage message) {
        String agentId = message.getAgentId();
        if (agentId == null) return;

        try {
            Map<String, Object> payload = objectMapper.convertValue(message.getPayload(), new TypeReference<>() {});
            TaskProgress progress = TaskProgress.builder()
                    .taskId(String.valueOf(payload.getOrDefault("taskId", "")))
                    .agentId(agentId)
                    .taskType(String.valueOf(payload.getOrDefault("taskType", "unknown")))
                    .status(String.valueOf(payload.getOrDefault("status", "RUNNING")))
                    .progress(payload.containsKey("progress") ? ((Number) payload.get("progress")).intValue() : 0)
                    .message(String.valueOf(payload.getOrDefault("message", "")))
                    .build();
            agentRegistry.updateProgress(progress);
            log.debug("Progress report from {}: {}%", agentId, progress.getProgress());
        } catch (Exception e) {
            log.error("Failed to parse progress report", e);
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.error("Channel exception", cause);
        ctx.close();
    }
}

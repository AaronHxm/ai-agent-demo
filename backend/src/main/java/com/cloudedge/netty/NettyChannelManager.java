package com.cloudedge.netty;

import com.cloudedge.protocol.NettyMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.Channel;
import io.netty.channel.ChannelId;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.util.concurrent.GlobalEventExecutor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Netty Channel 管理器
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NettyChannelManager {

    private final ObjectMapper objectMapper;
    private final ChannelGroup channelGroup = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
    private final Map<String, Channel> channelMap = new ConcurrentHashMap<>();

    public void addChannel(Channel channel) {
        channelGroup.add(channel);
        channelMap.put(channel.id().asShortText(), channel);
        log.info("Channel added: {}", channel.id().asShortText());
    }

    public void removeChannel(Channel channel) {
        String id = channel.id().asShortText();
        channelGroup.remove(channel);
        channelMap.remove(id);
        log.info("Channel removed: {}", id);
    }

    public Channel getChannel(String channelId) {
        return channelMap.get(channelId);
    }

    public boolean sendMessage(String channelId, NettyMessage message) {
        Channel channel = channelMap.get(channelId);
        if (channel == null || !channel.isActive()) {
            log.warn("Channel not found or inactive: {}", channelId);
            return false;
        }
        try {
            String json = objectMapper.writeValueAsString(message);
            channel.writeAndFlush(json + "\n");
            return true;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize message", e);
            return false;
        }
    }

    public void broadcast(NettyMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message) + "\n";
            channelGroup.writeAndFlush(json);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize broadcast message", e);
        }
    }
}

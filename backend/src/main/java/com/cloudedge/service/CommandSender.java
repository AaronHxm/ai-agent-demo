package com.cloudedge.service;

import com.cloudedge.domain.Agent;
import com.cloudedge.netty.NettyChannelManager;
import com.cloudedge.protocol.NettyMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 云端向边端发送指令
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommandSender {

    private final AgentRegistry agentRegistry;
    private final NettyChannelManager channelManager;

    /**
     * 发送指令给指定边端
     * 仅对通过 Netty 长连接注册的 Agent 有效
     *
     * @return true 表示已成功发送，false 表示该 Agent 未通过长连接或已离线
     */
    public boolean sendCommand(String agentId, Object command) {
        Optional<Agent> agentOpt = agentRegistry.getAgent(agentId);
        if (agentOpt.isEmpty()) {
            log.warn("Agent not found: {}", agentId);
            return false;
        }

        Agent agent = agentOpt.get();
        if (agent.getRegisterType() != Agent.RegisterType.LONG_CONNECTION) {
            log.warn("Agent {} registered via HTTP, cannot send command via Netty", agentId);
            return false;
        }

        String channelId = agent.getChannelId();
        if (channelId == null) {
            log.warn("Agent {} has no channel", agentId);
            return false;
        }

        String requestId = "cmd-" + System.currentTimeMillis();
        NettyMessage msg = NettyMessage.command(requestId, agentId, command);
        return channelManager.sendMessage(channelId, msg);
    }
}

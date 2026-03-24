package com.cloudedge.service;

import com.cloudedge.domain.Agent;
import com.cloudedge.domain.TaskProgress;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent 注册中心 - 管理边端的上线、下线、任务进度
 */
@Service
public class AgentRegistry {

    // agentId -> Agent
    private final Map<String, Agent> agents = new ConcurrentHashMap<>();
    // channelId -> agentId (Netty 长连接)
    private final Map<String, String> channelToAgent = new ConcurrentHashMap<>();
    // agentId -> 最新任务进度
    private final Map<String, TaskProgress> agentProgress = new ConcurrentHashMap<>();
    // agentId -> 历史任务进度列表
    private final Map<String, List<TaskProgress>> agentProgressHistory = new ConcurrentHashMap<>();

    /**
     * HTTP 方式注册 Agent
     */
    public Agent registerViaHttp(String agentId, String agentName, String host, Integer port) {
        Agent agent = Agent.builder()
                .agentId(agentId)
                .agentName(agentName != null ? agentName : agentId)
                .host(host)
                .port(port)
                .status(Agent.AgentStatus.ONLINE)
                .registerType(Agent.RegisterType.HTTP)
                .lastHeartbeat(Instant.now())
                .onlineTime(Instant.now())
                .build();
        agents.put(agentId, agent);
        return agent;
    }

    /**
     * Netty 长连接方式注册 Agent
     */
    public Agent registerViaLongConnection(String agentId, String agentName, String channelId, String host) {
        Agent agent = Agent.builder()
                .agentId(agentId)
                .agentName(agentName != null ? agentName : agentId)
                .host(host)
                .channelId(channelId)
                .status(Agent.AgentStatus.ONLINE)
                .registerType(Agent.RegisterType.LONG_CONNECTION)
                .lastHeartbeat(Instant.now())
                .onlineTime(Instant.now())
                .build();
        agents.put(agentId, agent);
        channelToAgent.put(channelId, agentId);
        return agent;
    }

    /**
     * 心跳更新
     */
    public void heartbeat(String agentId) {
        Agent agent = agents.get(agentId);
        if (agent != null) {
            agent.setLastHeartbeat(Instant.now());
        }
    }

    /**
     * 通过 Channel 心跳
     */
    public void heartbeatByChannel(String channelId) {
        String agentId = channelToAgent.get(channelId);
        if (agentId != null) {
            heartbeat(agentId);
        }
    }

    /**
     * 下线 - HTTP 注册的 Agent
     */
    public void offline(String agentId) {
        Agent agent = agents.get(agentId);
        if (agent != null) {
            agent.setStatus(Agent.AgentStatus.OFFLINE);
        }
    }

    /**
     * 下线 - 通过 Channel 断开
     */
    public void offlineByChannel(String channelId) {
        String agentId = channelToAgent.remove(channelId);
        if (agentId != null) {
            offline(agentId);
        }
    }

    /**
     * 更新任务进度
     */
    public void updateProgress(TaskProgress progress) {
        progress.setUpdateTime(Instant.now());
        agentProgress.put(progress.getAgentId(), progress);
        agentProgressHistory
                .computeIfAbsent(progress.getAgentId(), k -> new ArrayList<>())
                .add(progress);
    }

    /**
     * 获取所有在线 Agent
     */
    public List<Agent> getOnlineAgents() {
        return agents.values().stream()
                .filter(a -> a.getStatus() == Agent.AgentStatus.ONLINE)
                .toList();
    }

    /**
     * 获取所有 Agent（含离线）
     */
    public List<Agent> getAllAgents() {
        return new ArrayList<>(agents.values());
    }

    /**
     * 根据 agentId 获取 Agent
     */
    public Optional<Agent> getAgent(String agentId) {
        return Optional.ofNullable(agents.get(agentId));
    }

    /**
     * 获取指定 Agent 的最新进度
     */
    public Optional<TaskProgress> getAgentProgress(String agentId) {
        return Optional.ofNullable(agentProgress.get(agentId));
    }

    /**
     * 获取指定 Agent 的进度历史
     */
    public List<TaskProgress> getAgentProgressHistory(String agentId) {
        return agentProgressHistory.getOrDefault(agentId, Collections.emptyList());
    }

    /**
     * 获取所有 Agent 的任务进度历史
     */
    public List<TaskProgress> getAllProgressHistory() {
        List<TaskProgress> all = new ArrayList<>();
        for (List<TaskProgress> item : agentProgressHistory.values()) {
            all.addAll(item);
        }
        all.sort(Comparator.comparing(TaskProgress::getUpdateTime, Comparator.nullsLast(Comparator.naturalOrder())));
        return all;
    }

    /**
     * 根据 channelId 获取 Agent
     */
    public Optional<Agent> getAgentByChannel(String channelId) {
        String agentId = channelToAgent.get(channelId);
        return agentId != null ? Optional.ofNullable(agents.get(agentId)) : Optional.empty();
    }

    /**
     * 获取用于发送命令的 ChannelId（仅长连接注册的 Agent）
     */
    public Optional<String> getChannelId(String agentId) {
        return getAgent(agentId)
                .filter(a -> a.getRegisterType() == Agent.RegisterType.LONG_CONNECTION)
                .map(Agent::getChannelId);
    }
}

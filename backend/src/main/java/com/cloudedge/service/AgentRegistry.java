package com.cloudedge.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudedge.domain.Agent;
import com.cloudedge.domain.TaskProgress;
import com.cloudedge.entity.AgentEntity;
import com.cloudedge.entity.TaskProgressEntity;
import com.cloudedge.mapper.AgentMapper;
import com.cloudedge.mapper.TaskProgressMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

/**
 * Agent 注册中心 - 管理边端的上线、下线、任务进度
 * 使用 MyBatis-Plus 进行数据持久化
 */
@Service
@RequiredArgsConstructor
public class AgentRegistry {

    private final AgentMapper agentMapper;
    private final TaskProgressMapper taskProgressMapper;

    // channelId -> agentId (Netty 长连接)
    private final ConcurrentMap<String, String> channelToAgent = new ConcurrentHashMap<>();

    // 内存缓存 - 用于长连接场景加速查询
    private final ConcurrentMap<String, Agent> agentCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, TaskProgress> taskProgressCache = new ConcurrentHashMap<>();

    /**
     * HTTP 方式注册 Agent
     */
    @Transactional
    public Agent registerViaHttp(String agentId, String agentName, String host, Integer port,
                                  String skillDescription, String skillTags) {
        // 查询是否已存在
        AgentEntity existing = agentMapper.selectOne(
                new LambdaQueryWrapper<AgentEntity>().eq(AgentEntity::getAgentId, agentId)
        );

        LocalDateTime now = LocalDateTime.now();
        if (existing != null) {
            // 更新已有记录
            existing.setAgentName(agentName != null ? agentName : agentId);
            existing.setHost(host);
            existing.setPort(port);
            existing.setStatus("ONLINE");
            existing.setRegisterType("HTTP");
            existing.setLastHeartbeat(now);
            existing.setOnlineTime(existing.getOnlineTime() == null ? now : existing.getOnlineTime());
            existing.setSkillDescription(skillDescription);
            existing.setSkillTags(skillTags);
            agentMapper.updateById(existing);

            Agent agent = toAgent(existing);
            agentCache.put(agentId, agent);
            return agent;
        } else {
            // 新增记录
            AgentEntity entity = new AgentEntity();
            entity.setAgentId(agentId);
            entity.setAgentName(agentName != null ? agentName : agentId);
            entity.setHost(host);
            entity.setPort(port);
            entity.setStatus("ONLINE");
            entity.setRegisterType("HTTP");
            entity.setLastHeartbeat(now);
            entity.setOnlineTime(now);
            entity.setSkillDescription(skillDescription);
            entity.setSkillTags(skillTags);
            agentMapper.insert(entity);

            Agent agent = toAgent(entity);
            agentCache.put(agentId, agent);
            return agent;
        }
    }

    /**
     * Netty 长连接方式注册 Agent
     */
    @Transactional
    public Agent registerViaLongConnection(String agentId, String agentName, String channelId, String host,
                                            String skillDescription, String skillTags) {
        // 查询是否已存在
        AgentEntity existing = agentMapper.selectOne(
                new LambdaQueryWrapper<AgentEntity>().eq(AgentEntity::getAgentId, agentId)
        );

        LocalDateTime now = LocalDateTime.now();
        if (existing != null) {
            // 更新已有记录
            existing.setAgentName(agentName != null ? agentName : agentId);
            existing.setHost(host);
            existing.setChannelId(channelId);
            existing.setStatus("ONLINE");
            existing.setRegisterType("LONG_CONNECTION");
            existing.setLastHeartbeat(now);
            existing.setOnlineTime(existing.getOnlineTime() == null ? now : existing.getOnlineTime());
            existing.setSkillDescription(skillDescription);
            existing.setSkillTags(skillTags);
            agentMapper.updateById(existing);

            Agent agent = toAgent(existing);
            agentCache.put(agentId, agent);
            channelToAgent.put(channelId, agentId);
            return agent;
        } else {
            // 新增记录
            AgentEntity entity = new AgentEntity();
            entity.setAgentId(agentId);
            entity.setAgentName(agentName != null ? agentName : agentId);
            entity.setHost(host);
            entity.setPort(0); // 长连接不需要端口
            entity.setChannelId(channelId);
            entity.setStatus("ONLINE");
            entity.setRegisterType("LONG_CONNECTION");
            entity.setLastHeartbeat(now);
            entity.setOnlineTime(now);
            entity.setSkillDescription(skillDescription);
            entity.setSkillTags(skillTags);
            agentMapper.insert(entity);

            Agent agent = toAgent(entity);
            agentCache.put(agentId, agent);
            channelToAgent.put(channelId, agentId);
            return agent;
        }
    }

    /**
     * 心跳更新
     */
    public void heartbeat(String agentId) {
        AgentEntity entity = agentMapper.selectOne(
                new LambdaQueryWrapper<AgentEntity>().eq(AgentEntity::getAgentId, agentId)
        );
        if (entity != null) {
            entity.setLastHeartbeat(LocalDateTime.now());
            agentMapper.updateById(entity);

            // 更新缓存
            agentCache.computeIfPresent(agentId, (k, v) -> {
                v.setLastHeartbeat(java.time.Instant.now());
                return v;
            });
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
        AgentEntity entity = agentMapper.selectOne(
                new LambdaQueryWrapper<AgentEntity>().eq(AgentEntity::getAgentId, agentId)
        );
        if (entity != null) {
            entity.setStatus("OFFLINE");
            agentMapper.updateById(entity);

            // 更新缓存
            agentCache.computeIfPresent(agentId, (k, v) -> {
                v.setStatus(Agent.AgentStatus.OFFLINE);
                return v;
            });
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
    @Transactional
    public void updateProgress(TaskProgress progress) {
        progress.setUpdateTime(java.time.Instant.now());

        // 查询是否已存在
        TaskProgressEntity existing = taskProgressMapper.selectOne(
                new LambdaQueryWrapper<TaskProgressEntity>()
                        .eq(TaskProgressEntity::getTaskId, progress.getTaskId())
        );

        LocalDateTime now = LocalDateTime.now();
        if (existing != null) {
            existing.setStatus(progress.getStatus());
            existing.setProgress(progress.getProgress());
            existing.setMessage(progress.getMessage());
            existing.setUpdateTime(now);
            taskProgressMapper.updateById(existing);
        } else {
            TaskProgressEntity entity = toTaskProgressEntity(progress);
            entity.setUpdateTime(now);
            entity.setAgentId(progress.getAgentId());
            taskProgressMapper.insert(entity);
        }

        // 更新缓存
        taskProgressCache.put(progress.getAgentId(), progress);
    }

    /**
     * 获取所有在线 Agent
     */
    public List<Agent> getOnlineAgents() {
        List<AgentEntity> entities = agentMapper.selectList(
                new LambdaQueryWrapper<AgentEntity>()
                        .eq(AgentEntity::getStatus, "ONLINE")
        );
        return entities.stream().map(this::toAgent).collect(Collectors.toList());
    }

    /**
     * 获取所有 Agent（含离线）
     */
    public List<Agent> getAllAgents() {
        List<AgentEntity> entities = agentMapper.selectList(null);
        return entities.stream().map(this::toAgent).collect(Collectors.toList());
    }

    /**
     * 根据 agentId 获取 Agent
     */
    public Optional<Agent> getAgent(String agentId) {
        // 先从缓存获取
        Agent cached = agentCache.get(agentId);
        if (cached != null) {
            return Optional.of(cached);
        }

        // 从数据库查询
        AgentEntity entity = agentMapper.selectOne(
                new LambdaQueryWrapper<AgentEntity>().eq(AgentEntity::getAgentId, agentId)
        );
        if (entity != null) {
            Agent agent = toAgent(entity);
            agentCache.put(agentId, agent);
            return Optional.of(agent);
        }
        return Optional.empty();
    }

    /**
     * 获取指定 Agent 的最新进度
     */
    public Optional<TaskProgress> getAgentProgress(String agentId) {
        // 先从缓存获取
        TaskProgress cached = taskProgressCache.get(agentId);
        if (cached != null) {
            return Optional.of(cached);
        }

        // 从数据库查询最新记录
        TaskProgressEntity entity = taskProgressMapper.selectOne(
                new LambdaQueryWrapper<TaskProgressEntity>()
                        .eq(TaskProgressEntity::getAgentId, agentId)
                        .orderByDesc(TaskProgressEntity::getUpdateTime)
                        .last("LIMIT 1")
        );
        if (entity != null) {
            TaskProgress progress = toTaskProgress(entity);
            taskProgressCache.put(agentId, progress);
            return Optional.of(progress);
        }
        return Optional.empty();
    }

    /**
     * 获取指定 Agent 的进度历史
     */
    public List<TaskProgress> getAgentProgressHistory(String agentId) {
        List<TaskProgressEntity> entities = taskProgressMapper.selectList(
                new LambdaQueryWrapper<TaskProgressEntity>()
                        .eq(TaskProgressEntity::getAgentId, agentId)
                        .orderByDesc(TaskProgressEntity::getUpdateTime)
        );
        return entities.stream().map(this::toTaskProgress).collect(Collectors.toList());
    }

    /**
     * 获取所有 Agent 的任务进度历史
     */
    public List<TaskProgress> getAllProgressHistory() {
        List<TaskProgressEntity> entities = taskProgressMapper.selectList(
                new LambdaQueryWrapper<TaskProgressEntity>()
                        .orderByDesc(TaskProgressEntity::getUpdateTime)
        );
        return entities.stream().map(this::toTaskProgress).collect(Collectors.toList());
    }

    /**
     * 根据 channelId 获取 Agent
     */
    public Optional<Agent> getAgentByChannel(String channelId) {
        String agentId = channelToAgent.get(channelId);
        return agentId != null ? getAgent(agentId) : Optional.empty();
    }

    /**
     * 获取用于发送命令的 ChannelId（仅长连接注册的 Agent）
     */
    public Optional<String> getChannelId(String agentId) {
        return getAgent(agentId)
                .filter(a -> a.getRegisterType() == Agent.RegisterType.LONG_CONNECTION)
                .map(Agent::getChannelId);
    }

    // ==================== 转换方法 ====================

    private Agent toAgent(AgentEntity entity) {
        if (entity == null) {
            return null;
        }
        return Agent.builder()
                .agentId(entity.getAgentId())
                .agentName(entity.getAgentName())
                .host(entity.getHost())
                .port(entity.getPort())
                .status("ONLINE".equals(entity.getStatus()) ? Agent.AgentStatus.ONLINE : Agent.AgentStatus.OFFLINE)
                .channelId(entity.getChannelId())
                .registerType("LONG_CONNECTION".equals(entity.getRegisterType()) ?
                        Agent.RegisterType.LONG_CONNECTION : Agent.RegisterType.HTTP)
                .lastHeartbeat(entity.getLastHeartbeat() != null ?
                        entity.getLastHeartbeat().toInstant(java.time.ZoneOffset.UTC) : null)
                .onlineTime(entity.getOnlineTime() != null ?
                        entity.getOnlineTime().toInstant(java.time.ZoneOffset.UTC) : null)
                .build();
    }

    private TaskProgress toTaskProgress(TaskProgressEntity entity) {
        if (entity == null) {
            return null;
        }
        return TaskProgress.builder()
                .taskId(entity.getTaskId())
                .agentId(entity.getAgentId())
                .taskType(entity.getTaskType())
                .status(entity.getStatus())
                .progress(entity.getProgress())
                .message(entity.getMessage())
                .updateTime(entity.getUpdateTime() != null ?
                        entity.getUpdateTime().toInstant(java.time.ZoneOffset.UTC) : null)
                .build();
    }

    private TaskProgressEntity toTaskProgressEntity(TaskProgress progress) {
        if (progress == null) {
            return null;
        }
        TaskProgressEntity entity = new TaskProgressEntity();
        entity.setTaskId(progress.getTaskId());
        entity.setTaskType(progress.getTaskType());
        entity.setStatus(progress.getStatus());
        entity.setProgress(progress.getProgress());
        entity.setMessage(progress.getMessage());
        return entity;
    }
}

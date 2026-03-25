package com.cloudedge.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 边端 Agent 实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("agent")
public class AgentEntity extends BaseEntity {

    /**
     * Agent 唯一标识
     */
    private String agentId;

    /**
     * Agent 名称
     */
    private String agentName;

    /**
     * 主机地址
     */
    private String host;

    /**
     * 端口
     */
    private Integer port;

    /**
     * 状态：ONLINE / OFFLINE
     */
    private String status;

    /**
     * Netty Channel ID
     */
    private String channelId;

    /**
     * 注册方式：HTTP / LONG_CONNECTION
     */
    private String registerType;

    /**
     * 技能描述
     */
    private String skillDescription;

    /**
     * 技能标签（JSON 格式存储）
     */
    private String skillTags;

    /**
     * 最后心跳时间
     */
    private LocalDateTime lastHeartbeat;

    /**
     * 上线时间
     */
    private LocalDateTime onlineTime;
}

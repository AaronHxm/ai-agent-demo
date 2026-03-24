package com.cloudedge.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 边端Agent实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Agent {

    private String agentId;
    private String agentName;
    private String host;
    private Integer port;
    private AgentStatus status;
    private String channelId;        // Netty Channel ID，长连接时使用
    private RegisterType registerType; // HTTP 或 LONG_CONNECTION
    private Instant lastHeartbeat;
    private Instant onlineTime;

    public enum AgentStatus {
        ONLINE,
        OFFLINE
    }

    public enum RegisterType {
        HTTP,
        LONG_CONNECTION
    }
}

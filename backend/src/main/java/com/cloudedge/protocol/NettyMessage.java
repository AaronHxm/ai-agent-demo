package com.cloudedge.protocol;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Netty 通信协议消息体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NettyMessage {

    private String type;       // REGISTER, HEARTBEAT, COMMAND, PROGRESS_REPORT, COMMAND_ACK
    private String requestId;
    private String agentId;
    private Object payload;
    private Long timestamp;

    public static NettyMessage heartBeat(String agentId) {
        return NettyMessage.builder()
                .type("HEARTBEAT")
                .agentId(agentId)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static NettyMessage register(String agentId, Map<String, Object> info) {
        return NettyMessage.builder()
                .type("REGISTER")
                .agentId(agentId)
                .payload(info)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static NettyMessage command(String requestId, String agentId, Object command) {
        return NettyMessage.builder()
                .type("COMMAND")
                .requestId(requestId)
                .agentId(agentId)
                .payload(command)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static NettyMessage progressReport(String agentId, Object progress) {
        return NettyMessage.builder()
                .type("PROGRESS_REPORT")
                .agentId(agentId)
                .payload(progress)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}

package com.cloudedge.controller;

import com.cloudedge.domain.Agent;
import com.cloudedge.domain.TaskProgress;
import com.cloudedge.service.AgentRegistry;
import com.cloudedge.service.CommandSender;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Agent 管理 REST API
 */
@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgentController {

    private final AgentRegistry agentRegistry;
    private final CommandSender commandSender;

    /**
     * HTTP 方式注册 Agent
     */
    @PostMapping("/register")
    public ResponseEntity<Agent> register(@RequestBody RegisterRequest request) {
        Agent agent = agentRegistry.registerViaHttp(
                request.getAgentId(),
                request.getAgentName(),
                request.getHost(),
                request.getPort()
        );
        return ResponseEntity.ok(agent);
    }

    /**
     * Agent 下线
     */
    @PostMapping("/{agentId}/offline")
    public ResponseEntity<Void> offline(@PathVariable String agentId) {
        agentRegistry.offline(agentId);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取所有在线 Agent
     */
    @GetMapping("/online")
    public ResponseEntity<List<Agent>> listOnline() {
        return ResponseEntity.ok(agentRegistry.getOnlineAgents());
    }

    /**
     * 获取所有 Agent（含离线）
     */
    @GetMapping
    public ResponseEntity<List<Agent>> listAll() {
        return ResponseEntity.ok(agentRegistry.getAllAgents());
    }

    /**
     * 获取指定 Agent 详情
     */
    @GetMapping("/{agentId}")
    public ResponseEntity<Agent> getAgent(@PathVariable String agentId) {
        return agentRegistry.getAgent(agentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取指定 Agent 的最新任务进度
     */
    @GetMapping("/{agentId}/progress")
    public ResponseEntity<TaskProgress> getProgress(@PathVariable String agentId) {
        return agentRegistry.getAgentProgress(agentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取指定 Agent 的进度历史
     */
    @GetMapping("/{agentId}/progress/history")
    public ResponseEntity<List<TaskProgress>> getProgressHistory(@PathVariable String agentId) {
        return ResponseEntity.ok(agentRegistry.getAgentProgressHistory(agentId));
    }

    /**
     * 向边端发送指令（仅对 Netty 长连接注册的 Agent 有效）
     */
    @PostMapping("/{agentId}/command")
    public ResponseEntity<Map<String, Object>> sendCommand(
            @PathVariable String agentId,
            @RequestBody Map<String, Object> command) {
        boolean sent = commandSender.sendCommand(agentId, command);
        return ResponseEntity.ok(Map.of(
                "success", sent,
                "message", sent ? "Command sent" : "Agent not connected via Netty or offline"
        ));
    }

    @lombok.Data
    public static class RegisterRequest {
        private String agentId;
        private String agentName;
        private String host;
        private Integer port;
    }
}

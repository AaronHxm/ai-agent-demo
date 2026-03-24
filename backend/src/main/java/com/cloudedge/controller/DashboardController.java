package com.cloudedge.controller;

import com.cloudedge.domain.Agent;
import com.cloudedge.domain.TaskProgress;
import com.cloudedge.service.AgentRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final AgentRegistry agentRegistry;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        List<Agent> allAgents = agentRegistry.getAllAgents();
        long online = allAgents.stream().filter(a -> a.getStatus() == Agent.AgentStatus.ONLINE).count();
        long offline = allAgents.size() - online;

        List<TaskProgress> allTasks = agentRegistry.getAllProgressHistory();
        long runningTasks = allTasks.stream().filter(t -> "RUNNING".equalsIgnoreCase(t.getStatus())).count();
        long completedTasks = allTasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        long failedTasks = allTasks.stream().filter(t -> "FAILED".equalsIgnoreCase(t.getStatus())).count();

        return ResponseEntity.ok(Map.of(
                "totalAgents", allAgents.size(),
                "onlineAgents", online,
                "offlineAgents", offline,
                "totalTaskRecords", allTasks.size(),
                "runningTaskRecords", runningTasks,
                "completedTaskRecords", completedTasks,
                "failedTaskRecords", failedTasks
        ));
    }
}

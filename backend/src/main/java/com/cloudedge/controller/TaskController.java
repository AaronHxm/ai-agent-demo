package com.cloudedge.controller;

import com.cloudedge.domain.TaskProgress;
import com.cloudedge.service.AgentRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {

    private final AgentRegistry agentRegistry;

    @GetMapping
    public ResponseEntity<List<TaskProgress>> listAllTasks() {
        return ResponseEntity.ok(agentRegistry.getAllProgressHistory());
    }

    @GetMapping("/latest")
    public ResponseEntity<List<TaskProgress>> listLatestTasks() {
        Map<String, TaskProgress> latest = new LinkedHashMap<>();
        for (TaskProgress task : agentRegistry.getAllProgressHistory()) {
            String key = task.getAgentId() + "::" + task.getTaskId();
            latest.put(key, task);
        }
        return ResponseEntity.ok(latest.values().stream().toList());
    }

    @GetMapping("/agents/{agentId}")
    public ResponseEntity<List<TaskProgress>> listByAgent(@PathVariable String agentId) {
        return ResponseEntity.ok(agentRegistry.getAgentProgressHistory(agentId));
    }
}

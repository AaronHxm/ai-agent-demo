package com.cloudedge.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 边端任务进度
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskProgress {

    private String taskId;
    private String agentId;
    private String taskType;
    private String status;      // RUNNING, COMPLETED, FAILED
    private Integer progress;   // 0-100
    private String message;
    private Instant updateTime;
}

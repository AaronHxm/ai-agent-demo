package com.cloudedge.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 任务进度实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("task_progress")
public class TaskProgressEntity extends BaseEntity {

    /**
     * 任务唯一标识
     */
    private String taskId;

    /**
     * Agent ID
     */
    private String agentId;

    /**
     * 任务类型
     */
    private String taskType;

    /**
     * 任务状态：RUNNING / COMPLETED / FAILED
     */
    private String status;

    /**
     * 进度百分比 0-100
     */
    private Integer progress;

    /**
     * 进度消息
     */
    private String message;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}

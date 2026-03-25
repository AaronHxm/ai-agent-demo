-- 边端 Agent 表
CREATE TABLE agent (
    id              BIGSERIAL PRIMARY KEY,
    agent_id        VARCHAR(64) NOT NULL UNIQUE,
    agent_name      VARCHAR(128) NOT NULL,
    host            VARCHAR(255) NOT NULL,
    port            INTEGER NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'OFFLINE',
    channel_id      VARCHAR(128),
    register_type   VARCHAR(32) NOT NULL DEFAULT 'HTTP',

    -- 技能相关
    skill_description TEXT,
    skill_tags      VARCHAR(512),

    -- 心跳相关
    last_heartbeat  TIMESTAMP,
    online_time      TIMESTAMP,

    -- 审计字段
    version         INTEGER NOT NULL DEFAULT 0,
    created_by      VARCHAR(64),
    created_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(64),
    updated_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by      VARCHAR(64),
    deleted_time    TIMESTAMP
);

-- 任务进度表
CREATE TABLE task_progress (
    id              BIGSERIAL PRIMARY KEY,
    task_id         VARCHAR(64) NOT NULL UNIQUE,
    agent_id        VARCHAR(64) NOT NULL,
    task_type       VARCHAR(64) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'RUNNING',
    progress        INTEGER NOT NULL DEFAULT 0,
    message         TEXT,
    update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 审计字段
    version         INTEGER NOT NULL DEFAULT 0,
    created_by      VARCHAR(64),
    created_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(64),
    updated_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by      VARCHAR(64),
    deleted_time    TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_task_progress_agent FOREIGN KEY (agent_id) REFERENCES agent(agent_id)
);

-- 索引
CREATE INDEX idx_agent_status ON agent(status);
CREATE INDEX idx_agent_register_type ON agent(register_type);
CREATE INDEX idx_task_progress_agent_id ON task_progress(agent_id);
CREATE INDEX idx_task_progress_status ON task_progress(status);

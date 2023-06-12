export type Config = {
    parallelMax?: number;
    frame?: boolean;
}

export type TaskItem = {
    key: string;
    task: (res: any)=> Promise<any>,
    parallel?: boolean;
}

export type TaskList = TaskItem[]
export type Resolve = (value: any) => void
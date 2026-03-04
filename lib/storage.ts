import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Task {
  id: string;
  title: string;
  category: string;
  description: string;
  due_date: string | null;
  due_time: string | null;
  completed: boolean;
  progress?: number;
  color?: string;
  created_at: string;
}

const STORAGE_KEY = "tasks";

export const getTasks = async (): Promise<Task[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error reading tasks from storage:", e);
    return [];
  }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Error saving tasks to storage:", e);
  }
};

export const addTask = async (
  task: Omit<Task, "id" | "created_at" | "completed">,
): Promise<Task> => {
  const currentTasks = await getTasks();
  const newTask: Task = {
    ...task,
    id: Math.random().toString(36).substring(2, 9),
    completed: false,
    created_at: new Date().toISOString(),
  };
  const updatedTasks = [newTask, ...currentTasks];
  await saveTasks(updatedTasks);
  return newTask;
};

export const updateTask = async (
  id: string,
  updates: Partial<Task>,
): Promise<Task | null> => {
  const currentTasks = await getTasks();
  const taskIndex = currentTasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) return null;

  const updatedTask = { ...currentTasks[taskIndex], ...updates };
  currentTasks[taskIndex] = updatedTask;
  await saveTasks(currentTasks);
  return updatedTask;
};

export const deleteTask = async (id: string): Promise<void> => {
  const currentTasks = await getTasks();
  const filteredTasks = currentTasks.filter((t) => t.id !== id);
  await saveTasks(filteredTasks);
};

export const getTaskById = async (id: string): Promise<Task | undefined> => {
  const currentTasks = await getTasks();
  return currentTasks.find((t) => t.id === id);
};

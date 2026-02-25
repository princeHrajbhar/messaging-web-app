import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isThisYear, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isThisYear(date)) {
    return format(date, "MMM d, h:mm a");
  } else {
    return format(date, "MMM d, yyyy, h:mm a");
  }
}

export function formatConversationTime(timestamp: number): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isThisYear(date)) {
    return format(date, "MMM d");
  } else {
    return format(date, "MMM d, yyyy");
  }
}

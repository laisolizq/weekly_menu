import type { Component } from "../types/recipe";

const API_URL = import.meta.env.VITE_API_URL;

export async function getComponents(): Promise<Component[]> {
  const response = await fetch(`${API_URL}/components/`);

  if (!response.ok) {
    throw new Error("Error fetching components");
  }

  return response.json();
}
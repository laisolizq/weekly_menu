import type { DayPlan, Recipe } from "../types/recipe";
import type { ShoppingItem } from "./shoppingList";

const WIDTH = 1200;
const PADDING = 64;
const COLORS = {
  background: "#08171d",
  panel: "#102c34",
  border: "#28545d",
  heading: "#8ffff1",
  text: "#d7edef",
  muted: "#8aaeb3",
  accent: "#55e6d0",
};

function setupCanvas(height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la imagen");
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, WIDTH, height);
  return { canvas, context };
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawHeader(context: CanvasRenderingContext2D, title: string) {
  context.fillStyle = COLORS.heading;
  context.font = "600 36px sans-serif";
  context.fillText(title, PADDING, 70);
  context.fillStyle = COLORS.muted;
  context.font = "20px sans-serif";
  context.fillText("Menú semanal", PADDING, 105);
}

function recipeNames(recipeIds: string[], recipes: Recipe[]) {
  return recipeIds
    .map((id) => recipes.find((recipe) => recipe.id === id)?.name)
    .filter(Boolean)
    .join(" + ") || "Sin asignar";
}

export function downloadWeekImage(week: DayPlan[], recipes: Recipe[]) {
  const rowHeight = 112;
  const height = 140 + week.length * rowHeight + PADDING;
  const { canvas, context } = setupCanvas(height);
  drawHeader(context, "Mi semana");

  week.forEach((day, index) => {
    const y = 140 + index * rowHeight;
    context.fillStyle = COLORS.panel;
    context.fillRect(PADDING, y, WIDTH - PADDING * 2, 94);
    context.strokeStyle = COLORS.border;
    context.strokeRect(PADDING, y, WIDTH - PADDING * 2, 94);

    context.fillStyle = COLORS.accent;
    context.font = "600 22px sans-serif";
    context.fillText(day.day, PADDING + 20, y + 31);

    context.fillStyle = COLORS.text;
    context.font = "20px sans-serif";
    context.fillText(
      `Comida · ${day.lunch.people} personas · ${recipeNames(day.lunch.recipes, recipes)}`,
      PADDING + 180,
      y + 31
    );
    context.fillText(
      `Cena · ${day.dinner.people} personas · ${recipeNames(day.dinner.recipes, recipes)}`,
      PADDING + 180,
      y + 67
    );
  });

  downloadCanvas(canvas, "menu-semanal.png");
}

export function downloadShoppingImage(items: ShoppingItem[]) {
  const rowHeight = 52;
  const height = 160 + Math.max(items.length, 1) * rowHeight + PADDING;
  const { canvas, context } = setupCanvas(height);
  drawHeader(context, "Lista de la compra");

  const columns = [PADDING, 580, 760, 900];
  context.fillStyle = COLORS.panel;
  context.fillRect(PADDING, 130, WIDTH - PADDING * 2, 42);
  context.fillStyle = COLORS.accent;
  context.font = "600 18px sans-serif";
  ["Ingrediente", "Personas", "Días", "Total"].forEach((label, index) => {
    context.fillText(label, columns[index], 157);
  });

  items.forEach((item, index) => {
    const y = 208 + index * rowHeight;
    context.strokeStyle = COLORS.border;
    context.beginPath();
    context.moveTo(PADDING, y + 18);
    context.lineTo(WIDTH - PADDING, y + 18);
    context.stroke();

    context.fillStyle = COLORS.text;
    context.font = "20px sans-serif";
    context.fillText(item.name, columns[0], y);
    context.fillText(item.people.join(", "), columns[1], y);
    context.fillText(String(item.days), columns[2], y);
    context.fillText(`${item.total} personas-comida`, columns[3], y);
  });

  downloadCanvas(canvas, "lista-de-la-compra.png");
}

export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'rectangle';
export type ShapeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle'];

export const SHAPE_COLORS: { [key in ShapeColor]: string } = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
};

export interface Shape {
  id: string;
  type: ShapeType;
  color: string; // Storing hex value
  position: { top: string; left: string };
  rotation: number;
}

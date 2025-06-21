import { Shape, ShapeType, ShapeColor, SHAPE_TYPES, SHAPE_COLORS } from '@/types';

interface LevelConfig {
    shapeCount: number;
    shapeTypes: number;
    shapeColors: number;
}

const difficultySettings: Record<string, LevelConfig> = {
    'Very Easy': { shapeCount: 3, shapeTypes: 2, shapeColors: 2 },
    'Easy': { shapeCount: 4, shapeTypes: 3, shapeColors: 3 },
    'Normal': { shapeCount: 5, shapeTypes: 4, shapeColors: 4 },
    'Hard': { shapeCount: 6, shapeTypes: 5, shapeColors: 5 },
    'Very Hard': { shapeCount: 7, shapeTypes: 6, shapeColors: 6 },
};

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function getLevelConfig(level: number, difficulty: string): LevelConfig {
    const baseConfig = difficultySettings[difficulty] || difficultySettings['Normal'];
    const levelModifier = Math.floor((level - 1) / 5);
    return {
        shapeCount: Math.min(8, baseConfig.shapeCount + levelModifier),
        shapeTypes: Math.min(SHAPE_TYPES.length, baseConfig.shapeTypes + levelModifier),
        shapeColors: Math.min(Object.keys(SHAPE_COLORS).length, baseConfig.shapeColors + levelModifier),
    };
}


export function generateLevel(level: number, difficulty: string): Shape[] {
    const config = getLevelConfig(level, difficulty);

    const availableTypes = shuffleArray(SHAPE_TYPES).slice(0, config.shapeTypes);
    const availableColors = shuffleArray(Object.keys(SHAPE_COLORS) as ShapeColor[]).slice(0, config.shapeColors);

    const shapes: Shape[] = [];
    const positions = new Set<string>();

    for (let i = 0; i < config.shapeCount; i++) {
        const type = availableTypes[i % availableTypes.length];
        const colorName = availableColors[i % availableColors.length];
        const colorHex = SHAPE_COLORS[colorName];

        let top, left, positionKey;
        // Simple grid placement to avoid overlap
        do {
            const row = Math.floor(Math.random() * 4);
            const col = Math.floor(Math.random() * 5);
            top = `${10 + row * 22}%`;
            left = `${5 + col * 18}%`;
            positionKey = `${row}-${col}`;
        } while (positions.has(positionKey));
        positions.add(positionKey);


        shapes.push({
            id: `${type}-${i}`,
            type,
            color: colorHex,
            position: { top, left },
            rotation: Math.random() * 40 - 20,
        });
    }

    return shapes;
}

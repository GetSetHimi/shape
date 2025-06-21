"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Square, Triangle, Star, Heart, Volume2, Play, Repeat, Award } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from '@/hooks/useVoice';
import { generateLevel, getLevelConfig } from '@/lib/gameLogic';
import { adjustDifficulty } from '@/ai/flows/adaptive-difficutly-adjuster';
import { Shape, ShapeType } from '@/types';


type GameStatus = 'start' | 'playing' | 'level-complete' | 'game-over';

const SHAPE_ICONS: { [key in ShapeType]: React.ElementType } = {
    circle: Circle,
    square: Square,
    triangle: Triangle,
    star: Star,
    heart: Heart,
    rectangle: Square,
};

const ShapeComponent = React.memo(({ shape, onClick, isTarget, feedback }: { shape: Shape; onClick: (shape: Shape) => void; isTarget: boolean, feedback: 'correct' | 'wrong' | null }) => {
    const Icon = SHAPE_ICONS[shape.type];
    const isRectangle = shape.type === 'rectangle';

    const animation = feedback === 'correct' ? 'animate-pop' : feedback === 'wrong' ? 'animate-shake' : '';

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, rotate: shape.rotation - 30 }}
            animate={{ scale: 1, opacity: 1, rotate: shape.rotation }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ top: shape.position.top, left: shape.position.left }}
            className={`absolute cursor-pointer drop-shadow-lg transition-transform duration-200 hover:scale-110 ${animation}`}
            onClick={() => onClick(shape)}
            aria-label={`A ${shape.color} ${shape.type}`}
        >
            <Icon
                className="text-white"
                style={{
                    width: isRectangle ? '120px' : '80px',
                    height: '80px',
                    fill: shape.color,
                }}
            />
        </motion.div>
    );
});
ShapeComponent.displayName = 'ShapeComponent';

export default function ShapeExplorerGame() {
    const [status, setStatus] = useState<GameStatus>('start');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [targetShape, setTargetShape] = useState<Shape | null>(null);
    const [correctlyGuessed, setCorrectlyGuessed] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ id: string, type: 'correct' | 'wrong' } | null>(null);
    const [difficulty, setDifficulty] = useState('Normal');
    const [isThinking, setIsThinking] = useState(false);

    const { speak } = useVoice();
    const { toast } = useToast();

    const statsRef = useRef({
        correctTaps: 0,
        totalTaps: 0,
        startTime: 0,
        totalTime: 0,
        errorPatterns: {} as Record<string, number>,
    });
    
    const setupLevel = useCallback((currentLevel: number, currentDifficulty: string) => {
        const newShapes = generateLevel(currentLevel, currentDifficulty);
        setShapes(newShapes);
        setCorrectlyGuessed([]);
        
        const newTarget = newShapes[Math.floor(Math.random() * newShapes.length)];
        setTargetShape(newTarget);
        
        statsRef.current.startTime = Date.now();
    }, []);

    useEffect(() => {
        if (status === 'playing' && targetShape) {
            speak(`Tap the ${targetShape.type}`);
        }
    }, [targetShape, status, speak]);

    const handleShapeClick = (shape: Shape) => {
        if (status !== 'playing' || !targetShape || correctlyGuessed.includes(shape.id)) return;

        statsRef.current.totalTaps += 1;
        setFeedback({ id: shape.id, type: shape.id === targetShape.id ? 'correct' : 'wrong' });

        if (shape.id === targetShape.id) {
            statsRef.current.correctTaps += 1;
            statsRef.current.totalTime += Date.now() - statsRef.current.startTime;

            setScore(s => s + 100);
            const newCorrectlyGuessed = [...correctlyGuessed, shape.id];
            setCorrectlyGuessed(newCorrectlyGuessed);
            
            const remainingShapes = shapes.filter(s => !newCorrectlyGuessed.includes(s.id));

            if (remainingShapes.length === 0) {
                setStatus('level-complete');
            } else {
                const newTarget = remainingShapes[Math.floor(Math.random() * remainingShapes.length)];
                setTargetShape(newTarget);
                statsRef.current.startTime = Date.now();
            }
        } else {
            const errorKey = `tapped ${shape.type} instead of ${targetShape.type}`;
            statsRef.current.errorPatterns[errorKey] = (statsRef.current.errorPatterns[errorKey] || 0) + 1;
            setScore(s => Math.max(0, s - 10));
            speak('Oops, try again!');
        }
        
        setTimeout(() => setFeedback(null), 500);
    };

    const runDifficultyAdjustment = async () => {
        setIsThinking(true);
        const { correctTaps, totalTaps, totalTime, errorPatterns } = statsRef.current;
        const successRate = totalTaps > 0 ? correctTaps / totalTaps : 1;
        const speed = correctTaps > 0 ? totalTime / correctTaps / 1000 : 5; // average time in seconds
        const errorString = Object.entries(errorPatterns).map(([k,v]) => `${k} (${v} times)`).join(', ') || 'None';

        try {
            const result = await adjustDifficulty({
                successRate,
                speed,
                errorPatterns: errorString,
                currentDifficulty: difficulty,
            });
            setDifficulty(result.suggestedDifficulty);
            toast({
                title: "Difficulty Adjusted!",
                description: result.reasoning,
            });
        } catch (error) {
            console.error("Failed to adjust difficulty:", error);
            toast({
                variant: "destructive",
                title: "AI Error",
                description: "Could not adjust difficulty. Sticking to current level.",
            });
        } finally {
            setIsThinking(false);
        }
    };
    
    useEffect(() => {
        if (status === 'level-complete') {
            runDifficultyAdjustment();
        }
    }, [status]);


    const handleNextLevel = () => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setStatus('playing');
        statsRef.current = { correctTaps: 0, totalTaps: 0, startTime: 0, totalTime: 0, errorPatterns: {} };
        setupLevel(nextLevel, difficulty);
    };

    const handleStartGame = () => {
        setLevel(1);
        setScore(0);
        setDifficulty('Normal');
        setStatus('playing');
        statsRef.current = { correctTaps: 0, totalTaps: 0, startTime: 0, totalTime: 0, errorPatterns: {} };
        setupLevel(1, 'Normal');
    };
    
    const handleRestart = () => {
        setStatus('start');
    };
    
    const levelConfig = getLevelConfig(level, difficulty);
    const progress = (correctlyGuessed.length / levelConfig.shapeCount) * 100;

    return (
        <Card className="w-full max-w-4xl h-[70vh] max-h-[800px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-primary" />
                    <CardTitle className="text-2xl">Shape Explorers</CardTitle>
                </div>
                 {status === 'playing' && targetShape && (
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => speak(`Tap the ${targetShape.type}`)}>
                            <Volume2 className="w-6 h-6 text-accent"/>
                        </Button>
                        <div className="text-xl font-bold">Score: {score}</div>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-grow p-0 relative">
                {status === 'start' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-background/50">
                        <h2 className="text-5xl font-bold text-primary animate-tada">Welcome!</h2>
                        <Button size="lg" className="text-2xl h-16 px-12 rounded-full" onClick={handleStartGame}>
                            <Play className="w-8 h-8 mr-4" />
                            Start Game
                        </Button>
                    </div>
                )}
                
                <AnimatePresence>
                    {status === 'playing' && shapes.map(shape => (
                        !correctlyGuessed.includes(shape.id) && (
                            <ShapeComponent
                                key={shape.id}
                                shape={shape}
                                onClick={handleShapeClick}
                                isTarget={targetShape?.id === shape.id}
                                feedback={feedback && feedback.id === shape.id ? feedback.type : null}
                            />
                        )
                    ))}
                </AnimatePresence>

                 {status === 'playing' && (
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-4">
                           <span className="font-semibold text-sm w-28">Level {level}</span>
                           <Progress value={progress} className="w-full h-4"/>
                        </div>
                    </div>
                 )}

                <AlertDialog open={status === 'level-complete'}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-4xl text-center animate-tada">Level {level} Complete!</AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-lg">
                                Awesome job! Your score is {score}.
                                {isThinking && <p className="text-sm mt-2">Our friendly robot is thinking of the next challenge for you...</p>}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button onClick={handleRestart} variant="secondary" className="w-full sm:w-auto">
                                <Repeat className="mr-2"/>
                                Main Menu
                            </Button>
                            <Button onClick={handleNextLevel} disabled={isThinking} className="w-full sm:w-auto">
                                {isThinking ? 'Thinking...' : 'Next Level'}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

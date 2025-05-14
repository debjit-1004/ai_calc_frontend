import React, { useEffect, useRef, useState } from 'react';
import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';



// Define interfaces for better type safety
interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface Position {
    x: number;
    y: number;
}

// Declare global MathJax type
declare global {
      interface Window {
              MathJax: {
                typesetPromise: (elements?: HTMLElement[]) => Promise<void>;
                tex2svg?: (input: string) => HTMLElement;
                startup?: {
                  promise?: Promise<void>;
                  typeset?: boolean;
                };
                tex?: {
                  inlineMath?: Array<[string, string]>;
                };
                svg?: {
                  fontCache?: string;
                };
              };
            }
  }
  

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({});
    const [result, setResult] = useState<GeneratedResult | undefined>();
    const [latexPosition, setLatexPosition] = useState<Position>({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<string[]>([]);    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            const typeset = async () => {
                try {
                    await window.MathJax.startup?.promise;
                    await window.MathJax.typesetPromise();
                } catch (err) {
                    console.error('Typeset failed:', err);
                }
            };
            typeset();
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);    useEffect(() => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }

        // Configure MathJax before loading the script
        window.MathJax = window.MathJax || {};
        // Add configuration while preserving required properties
        Object.assign(window.MathJax, {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']]
            },
            svg: {
                fontCache: 'global'
            },
            startup: {
                typeset: false
            }
        });

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
        script.async = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression(prev => [...prev, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };  

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/calculate`,
                    {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        withCredentials: false // Set to true if you need to send cookies
                    }
                );

                const resp = response.data;
                console.log('Response', resp);

                resp.data.forEach((data: Response) => {
                    if (data.assign) {
                        setDictOfVars(prev => ({
                            ...prev,
                            [data.expr]: data.result
                        }));
                    }
                });

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width; x++) {
                            const i = (y * canvas.width + x) * 4;
                            if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                                minX = Math.min(minX, x);
                                minY = Math.min(minY, y);
                                maxX = Math.max(maxX, x);
                                maxY = Math.max(maxY, y);
                            }
                        }
                    }

                    const centerX = (minX + maxX) / 2;
                    const centerY = (minY + maxY) / 2;

                    setLatexPosition({ x: centerX, y: centerY });
                }

                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result
                        });
                    }, 1000);
                });
            } catch (error) {
                console.error('Error in runRoute:', error);
                // Handle error (e.g., show error message to user)
            }
        }
    };

    return (
        <>
            <div className='grid grid-cols-3 gap-2'>
                <Button
                    onClick={() => setReset(true)}
                    className='z-20 bg-black text-white'
                    variant='default' 
                    color='black'
                >
                    Reset
                </Button>
                <Group className='z-20'>
                    {SWATCHES.map((swatch) => (
                        <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
                    ))}
                </Group>
                <Button
                    onClick={runRoute}
                    className='z-20 bg-black text-white'
                    variant='default'
                    color='white'
                >
                    Run
                </Button>
            </div>
            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-0 left-0 w-full h-full'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(_e, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-2 text-white rounded shadow-md">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}
        </>
    );
}
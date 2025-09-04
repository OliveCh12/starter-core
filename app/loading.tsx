// components/ui/crystalline-loader.tsx

'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils'; // Assurez-vous que le chemin vers votre utilitaire cn est correct

// Interface pour les props du composant, permettant de personnaliser l'animation
interface CrystallineLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Vitesse de l'onde. Défaut: 1.0 */
  speed?: number;
  /** Densité des points. Plus la valeur est élevée, plus il y a de points. Défaut: 30 */
  density?: number;
  /** Largeur de l'onde en pixels. Défaut: 80 */
  waveWidth?: number;
  /** Déplacement maximal des points par l'onde. Défaut: 15 */
  displacement?: number;
}

/**
 * Un composant de chargement animé qui affiche une onde de réfraction cristalline.
 * Il s'adapte à la taille de son conteneur parent et utilise la couleur primaire du thème (light/dark mode).
 */
export default function Loading({
  className,
  speed = 1.0,
  density = 30,
  waveWidth = 80,
  displacement = 15,
  ...props
}: CrystallineLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    
    // Fonction pour extraire la valeur de base d'une couleur oklch/rgb/etc.
    const getBaseColor = (colorString: string): string => {
        const match = colorString.match(/oklch\(([^)]+)\)/);
        if (match) {
            const values = match[1].split(' ');
            return `oklch(${values[0]} ${values[1]} ${values[2]}`;
        }
        // Fallback pour d'autres formats si nécessaire
        return colorString;
    };

    let basePrimaryColor = '';
    
    const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const setupAndRunAnimation = () => {
        const parent = canvas.parentElement;
        if (!parent) return;

        // Adapte la taille du canvas à celle de son conteneur
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Récupère la couleur primaire du thème dynamiquement
        const computedStyle = getComputedStyle(canvas);
        const primaryColorValue = computedStyle.getPropertyValue('--primary').trim();
        basePrimaryColor = getBaseColor(primaryColorValue);


        // Calcule la grille de points en fonction de la densité et de la taille
        const gridSize = Math.max(20, Math.min(60, Math.floor(density * Math.min(canvas.width, canvas.height) / 800)));
        const spacing = Math.max(canvas.width, canvas.height) / (gridSize - 1);
        const dots: { x: number; y: number; }[] = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                dots.push({ x: c * spacing, y: r * spacing });
            }
        }

        const animate = (timestamp: number) => {
            time += timestamp * 0.0001 * speed; // Ajustement de la vitesse

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const waveRadius = (time % 1) * Math.max(canvas.width, canvas.height) * 0.7;

            dots.forEach((dot) => {
                const dist = Math.hypot(dot.x - centerX, dot.y - centerY);
                const distToWave = Math.abs(dist - waveRadius);
                
                let dotDisplacement = 0;
                if (distToWave < waveWidth / 2) {
                    const wavePhase = (distToWave / (waveWidth / 2)) * Math.PI;
                    dotDisplacement = easeInOutCubic(Math.sin(wavePhase)) * displacement;
                }

                const angleToCenter = Math.atan2(dot.y - centerY, dot.x - centerX);
                const dx = Math.cos(angleToCenter) * dotDisplacement;
                const dy = Math.sin(angleToCenter) * dotDisplacement;
                
                const opacity = 0.2 + (Math.abs(dotDisplacement) / displacement) * 0.8;
                const size = 1.5 + (Math.abs(dotDisplacement) / displacement) * 3;

                ctx.beginPath();
                ctx.arc(dot.x + dx, dot.y + dy, size, 0, Math.PI * 2);
                ctx.fillStyle = `${basePrimaryColor} / ${opacity})`;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };
        
        // Lance la première frame
        let lastTime = 0;
        const startAnimation = (timestamp: number) => {
            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            animate(deltaTime);
        }
        
        animationFrameId = requestAnimationFrame(startAnimation);
    };

    // Utilise ResizeObserver pour relancer l'animation si le conteneur change de taille
    const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(animationFrameId);
        setupAndRunAnimation();
    });

    if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
    }
    
    // Démarrage initial
    setupAndRunAnimation();

    // Fonction de nettoyage
    return () => {
        cancelAnimationFrame(animationFrameId);
        if (canvas.parentElement) {
            resizeObserver.unobserve(canvas.parentElement);
        }
    };
  }, [speed, density, waveWidth, displacement]); // Redéclenche l'effet si les props changent

  return (
    <div className={cn('relative w-full h-full', className)} {...props}>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
}
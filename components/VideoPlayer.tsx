
import React, { useState, useEffect } from 'react';

interface VideoPlayerProps {
    images: string[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
                setIsFading(false);
            }, 500); // This should match the fade-out duration
        }, 2500); // Time each image is displayed

        return () => clearInterval(interval);
    }, [images.length]);

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full h-full bg-black">
            <img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`Generated scene ${currentIndex + 1}`}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            />
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                {`Scene ${currentIndex + 1} / ${images.length}`}
            </div>
        </div>
    );
};

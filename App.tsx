/// <reference lib="dom" />

import React, { useState, useCallback, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { generateStoryboard, generateImageForScene } from './services/geminiService';
import type { LoadingState, AspectRatio, DownloadState } from './types';
import { Loader } from './components/Loader';
import { VideoPlayer } from './components/VideoPlayer';
import { SparklesIcon, FilmIcon, ExclamationTriangleIcon, AspectRatio16x9Icon, AspectRatio9x16Icon, AspectRatio1x1Icon, DownloadIcon } from './components/Icons';

const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, message: '' });
    const [downloadState, setDownloadState] = useState<DownloadState>({ isDownloading: false, message: '' });
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt for your video idea.");
            return;
        }
        if (loadingState.isLoading) return;

        setError(null);
        setGeneratedImages([]);
        setLoadingState({ isLoading: true, message: 'Warming up the AI director...' });

        try {
            // Step 1: Generate storyboard from the main prompt
            setLoadingState({ isLoading: true, message: 'Generating storyboard...' });
            const scenes = await generateStoryboard(prompt);
            
            if (!scenes || scenes.length === 0) {
              throw new Error("The AI failed to create a storyboard. Please try a different prompt.");
            }

            // Step 2: Generate an image for each scene
            const newImages: string[] = [];

            for (let i = 0; i < scenes.length; i++) {
                setLoadingState({ isLoading: true, message: `Rendering scene ${i + 1} of ${scenes.length}...` });
                const imageBase64 = await generateImageForScene(scenes[i], aspectRatio);
                newImages.push(`data:image/jpeg;base64,${imageBase64}`);
                setGeneratedImages([...newImages]); // Update state progressively
            }

            setLoadingState({ isLoading: false, message: 'Done!' });

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(`Generation failed: ${errorMessage}`);
            setLoadingState({ isLoading: false, message: '' });
        }
    }, [prompt, loadingState.isLoading, aspectRatio]);

    const handleDownload = useCallback(async () => {
        if (generatedImages.length === 0 || downloadState.isDownloading) return;

        setError(null);
        setDownloadState({ isDownloading: true, message: 'Loading FFMpeg...' });
        
        const ffmpeg = new FFmpeg();

        try {
            // Load the multi-threaded version of FFmpeg from a local '/ffmpeg/' directory.
            // This requires Cross-Origin-Isolation headers to be set on the page.
            const coreURL = '/ffmpeg/ffmpeg-core.js';
            const wasmURL = '/ffmpeg/ffmpeg-core.wasm';
            const workerURL = '/ffmpeg/ffmpeg-core.worker.js';

            await ffmpeg.load({
                coreURL: await toBlobURL(coreURL, 'text/javascript'),
                wasmURL: await toBlobURL(wasmURL, 'application/wasm'),
                workerURL: await toBlobURL(workerURL, 'text/javascript'),
            });
            
            setDownloadState({ isDownloading: true, message: 'Writing files...' });

            for (let i = 0; i < generatedImages.length; i++) {
                const imageName = `input-${String(i).padStart(2, '0')}.jpg`;
                const fileData = await fetchFile(generatedImages[i]);
                await ffmpeg.writeFile(imageName, fileData);
            }

            setDownloadState({ isDownloading: true, message: 'Encoding MP4...' });
            
            // Each image will be shown for 1.5 seconds (framerate 1/1.5 = 2/3)
            // -r 30 sets the output video framerate to a standard 30fps for compatibility
            await ffmpeg.exec([
                '-framerate', '2/3', 
                '-i', 'input-%02d.jpg', 
                '-c:v', 'libx264', 
                '-pix_fmt', 'yuv420p', 
                '-r', '30', 
                'output.mp4'
            ]);

            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai_storyboard.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Failed to create MP4 for download:", e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during download preparation.";
            setError(errorMessage);
        } finally {
            setDownloadState({ isDownloading: false, message: '' });
        }
    }, [generatedImages, downloadState.isDownloading]);

    const getAspectRatioContainerClass = (ratio: AspectRatio) => {
        switch (ratio) {
            case '9:16':
                return 'aspect-[9/16] max-w-sm mx-auto';
            case '1:1':
                return 'aspect-square max-w-lg mx-auto';
            case '16:9':
            default:
                return 'aspect-video w-full';
        }
    };
    
    const aspectRatioButtonClass = (ratio: AspectRatio) => 
        `flex-1 flex items-center justify-center gap-2 p-2 rounded-md transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
            aspectRatio === ratio ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 flex items-center justify-center gap-3">
                        <FilmIcon />
                        AI Video Storyboard
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Turn your ideas into visual stories. Describe a scene, and we'll generate a storyboard for it.
                    </p>
                </header>

                <main className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl shadow-indigo-500/10 border border-gray-700 backdrop-blur-sm">
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={prompt}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                            placeholder="e.g., A robot exploring a lush, alien jungle at sunrise"
                            className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-300 resize-none h-28"
                            disabled={loadingState.isLoading}
                            aria-label="Video prompt"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
                                <div className="flex gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700">
                                    <button onClick={() => setAspectRatio('16:9')} className={aspectRatioButtonClass('16:9')} aria-label="Aspect ratio 16 by 9">
                                        <AspectRatio16x9Icon /> 16:9
                                    </button>
                                    <button onClick={() => setAspectRatio('9:16')} className={aspectRatioButtonClass('9:16')} aria-label="Aspect ratio 9 by 16">
                                        <AspectRatio9x16Icon /> 9:16
                                    </button>
                                    <button onClick={() => setAspectRatio('1:1')} className={aspectRatioButtonClass('1:1')} aria-label="Aspect ratio 1 by 1">
                                        <AspectRatio1x1Icon /> 1:1
                                    </button>
                                </div>
                            </div>
                           <div className="flex flex-col justify-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loadingState.isLoading || !prompt}
                                    className="w-full h-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 shadow-lg shadow-indigo-600/30"
                                >
                                    {loadingState.isLoading ? (
                                        <>
                                            <Loader />
                                            <span>{loadingState.message}</span>
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon />
                                            <span>Generate Storyboard</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                <div className="mt-8 w-full">
                    {error && (
                        <div role="alert" className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-3">
                            <ExclamationTriangleIcon />
                            <p>{error}</p>
                        </div>
                    )}

                    {!loadingState.isLoading && generatedImages.length === 0 && !error && (
                         <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-700 rounded-xl">
                            <p>Your generated video storyboard will appear here.</p>
                        </div>
                    )}
                    
                    {generatedImages.length > 0 && (
                        <>
                            <div className={`${getAspectRatioContainerClass(aspectRatio)} bg-black rounded-xl overflow-hidden shadow-2xl shadow-black transition-all duration-500`}>
                               <VideoPlayer images={generatedImages} />
                            </div>
                             <div className="mt-6 flex justify-center">
                                <button
                                    onClick={handleDownload}
                                    disabled={downloadState.isDownloading}
                                    className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 shadow-lg shadow-green-600/30"
                                    aria-label="Download video as MP4"
                                >
                                    {downloadState.isDownloading ? (
                                        <>
                                            <Loader />
                                            <span>{downloadState.message}</span>
                                        </>
                                    ) : (
                                        <>
                                            <DownloadIcon />
                                            <span>Download Video (MP4)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
import React from 'react';

interface FlowerDecorationProps {
    className?: string;
    style?: React.CSSProperties;
}

export const FlowerCorner: React.FC<FlowerDecorationProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
    >
        <path
            d="M20 20C50 20 80 40 80 80C80 120 50 140 20 140"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M20 20C20 50 40 80 80 80C120 80 140 50 140 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="4" fill="currentColor" />
        <path
            d="M80 80C100 100 120 100 140 80"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
        />
        <path
            d="M20 140C30 150 40 150 50 140"
            stroke="currentColor"
            strokeWidth="1"
        />
        <circle cx="140" cy="20" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="20" cy="140" r="3" fill="currentColor" opacity="0.6" />
    </svg>
);

export const FlowerDivider: React.FC<FlowerDecorationProps> = ({ className, style }) => (
    <svg
        viewBox="0 0 400 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
    >
        <path
            d="M0 30H400"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
        />
        <path
            d="M180 30C180 20 190 10 200 10C210 10 220 20 220 30C220 40 210 50 200 50C190 50 180 40 180 30Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <circle cx="200" cy="30" r="4" fill="currentColor" />
        <path
            d="M160 30C165 25 170 25 175 30C170 35 165 35 160 30Z"
            fill="currentColor"
            opacity="0.6"
        />
        <path
            d="M240 30C235 25 230 25 225 30C230 35 235 35 240 30Z"
            fill="currentColor"
            opacity="0.6"
        />
    </svg>
);

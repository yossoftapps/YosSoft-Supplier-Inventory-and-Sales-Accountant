/**
 * مكونات التحميل المحسّنة
 * توفر تجربة مستخدم أفضل أثناء انتظار تحميل البيانات
 */

import React from 'react';
import './LoadingComponents.css';

/**
 * دوّار تحميل بسيط
 */
export const Spinner = ({ size = 'medium', color = '#1890ff' }) => {
    const sizeClass = `spinner--${size}`;

    return (
        <div className={`spinner ${sizeClass}`}>
            <div className="spinner__circle" style={{ borderTopColor: color }}></div>
        </div>
    );
};

/**
 * شاشة تحميل كاملة مع رسالة
 */
export const LoadingScreen = ({
    message = 'جاري التحميل...',
    submessage = null,
    progress = null
}) => {
    return (
        <div className="loading-screen">
            <div className="loading-screen__content">
                <Spinner size="large" />
                <h2 className="loading-screen__message">{message}</h2>
                {submessage && (
                    <p className="loading-screen__submessage">{submessage}</p>
                )}
                {progress !== null && (
                    <div className="loading-screen__progress">
                        <div className="loading-screen__progress-bar">
                            <div
                                className="loading-screen__progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="loading-screen__progress-text">{progress}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * هيكل عظمي للبطاقات (Skeleton Loader)
 */
export const CardSkeleton = ({ count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="card-skeleton">
                    <div className="card-skeleton__header">
                        <div className="skeleton skeleton--circle"></div>
                        <div className="skeleton skeleton--text skeleton--text-title"></div>
                    </div>
                    <div className="card-skeleton__content">
                        <div className="skeleton skeleton--text"></div>
                        <div className="skeleton skeleton--text"></div>
                        <div className="skeleton skeleton--text skeleton--text-short"></div>
                    </div>
                </div>
            ))}
        </>
    );
};

/**
 * هيكل عظمي للجداول
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="table-skeleton">
            <div className="table-skeleton__header">
                {Array.from({ length: columns }).map((_, index) => (
                    <div key={index} className="skeleton skeleton--text skeleton--text-header"></div>
                ))}
            </div>
            <div className="table-skeleton__body">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="table-skeleton__row">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div key={colIndex} className="skeleton skeleton--text"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * مؤشر تقدم دائري
 */
export const CircularProgress = ({
    progress = 0,
    size = 120,
    strokeWidth = 8,
    color = '#1890ff',
    showPercentage = true
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="circular-progress__bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="circular-progress__fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            {showPercentage && (
                <div className="circular-progress__text">
                    <span className="circular-progress__percentage">{Math.round(progress)}%</span>
                </div>
            )}
        </div>
    );
};

/**
 * شريط تقدم خطي
 */
export const LinearProgress = ({
    progress = 0,
    showPercentage = true,
    color = '#1890ff',
    height = 8,
    animated = true
}) => {
    return (
        <div className="linear-progress" style={{ height }}>
            <div
                className={`linear-progress__fill ${animated ? 'linear-progress__fill--animated' : ''}`}
                style={{
                    width: `${progress}%`,
                    backgroundColor: color
                }}
            ></div>
            {showPercentage && (
                <span className="linear-progress__text">{Math.round(progress)}%</span>
            )}
        </div>
    );
};

/**
 * نقاط تحميل متحركة
 */
export const DotLoader = ({ color = '#1890ff' }) => {
    return (
        <div className="dot-loader">
            <div className="dot-loader__dot" style={{ backgroundColor: color }}></div>
            <div className="dot-loader__dot" style={{ backgroundColor: color }}></div>
            <div className="dot-loader__dot" style={{ backgroundColor: color }}></div>
        </div>
    );
};

/**
 * مكون تحميل مع رسالة مخصصة
 */
export const LoadingOverlay = ({
    visible = false,
    message = 'جاري المعالجة...',
    transparent = false
}) => {
    if (!visible) return null;

    return (
        <div className={`loading-overlay ${transparent ? 'loading-overlay--transparent' : ''}`}>
            <div className="loading-overlay__content">
                <Spinner size="large" />
                <p className="loading-overlay__message">{message}</p>
            </div>
        </div>
    );
};

export default {
    Spinner,
    LoadingScreen,
    CardSkeleton,
    TableSkeleton,
    CircularProgress,
    LinearProgress,
    DotLoader,
    LoadingOverlay
};

/**
 * مكون بطاقة تفاعلية محسّنة
 * يوفر تأثيرات حركية وتفاعلية جميلة
 */

import React from 'react';
import './EnhancedCard.css';

/**
 * بطاقة تفاعلية مع تأثيرات hover
 */
const EnhancedCard = ({
    children,
    title,
    subtitle,
    icon,
    onClick,
    className = '',
    hoverable = true,
    loading = false,
    style = {}
}) => {
    const cardClasses = [
        'enhanced-card',
        hoverable ? 'enhanced-card--hoverable' : '',
        loading ? 'enhanced-card--loading' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClasses}
            onClick={onClick}
            style={style}
        >
            {loading && (
                <div className="enhanced-card__loading-overlay">
                    <div className="enhanced-card__spinner"></div>
                </div>
            )}

            {(title || icon) && (
                <div className="enhanced-card__header">
                    {icon && (
                        <div className="enhanced-card__icon">
                            {icon}
                        </div>
                    )}
                    <div className="enhanced-card__title-wrapper">
                        {title && <h3 className="enhanced-card__title">{title}</h3>}
                        {subtitle && <p className="enhanced-card__subtitle">{subtitle}</p>}
                    </div>
                </div>
            )}

            <div className="enhanced-card__content">
                {children}
            </div>
        </div>
    );
};

/**
 * بطاقة إحصائية مع رسوم بيانية صغيرة
 */
export const StatCard = ({
    title,
    value,
    change,
    changeType = 'neutral', // 'positive', 'negative', 'neutral'
    icon,
    trend,
    onClick,
    loading = false
}) => {
    const changeClass = `stat-card__change stat-card__change--${changeType}`;

    return (
        <EnhancedCard
            className="stat-card"
            onClick={onClick}
            hoverable={!!onClick}
            loading={loading}
        >
            <div className="stat-card__content">
                <div className="stat-card__main">
                    {icon && <div className="stat-card__icon">{icon}</div>}
                    <div className="stat-card__info">
                        <p className="stat-card__title">{title}</p>
                        <h2 className="stat-card__value">{value}</h2>
                        {change && (
                            <p className={changeClass}>
                                <span className="stat-card__change-icon">
                                    {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'}
                                </span>
                                {change}
                            </p>
                        )}
                    </div>
                </div>
                {trend && (
                    <div className="stat-card__trend">
                        {trend}
                    </div>
                )}
            </div>
        </EnhancedCard>
    );
};

/**
 * بطاقة قابلة للطي
 */
export const CollapsibleCard = ({
    title,
    children,
    defaultExpanded = false,
    icon
}) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);

    return (
        <div className={`collapsible-card ${expanded ? 'collapsible-card--expanded' : ''}`}>
            <div
                className="collapsible-card__header"
                onClick={() => setExpanded(!expanded)}
            >
                {icon && <div className="collapsible-card__icon">{icon}</div>}
                <h3 className="collapsible-card__title">{title}</h3>
                <button className="collapsible-card__toggle">
                    <span className={`collapsible-card__arrow ${expanded ? 'collapsible-card__arrow--up' : ''}`}>
                        ▼
                    </span>
                </button>
            </div>

            <div className={`collapsible-card__content ${expanded ? 'collapsible-card__content--visible' : ''}`}>
                <div className="collapsible-card__inner">
                    {children}
                </div>
            </div>
        </div>
    );
};

/**
 * بطاقة مع إجراءات
 */
export const ActionCard = ({
    title,
    subtitle,
    children,
    actions = [],
    icon
}) => {
    return (
        <EnhancedCard
            title={title}
            subtitle={subtitle}
            icon={icon}
            className="action-card"
        >
            {children}

            {actions.length > 0 && (
                <div className="action-card__actions">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className={`action-card__button ${action.primary ? 'action-card__button--primary' : ''}`}
                            onClick={action.onClick}
                            disabled={action.disabled}
                        >
                            {action.icon && <span className="action-card__button-icon">{action.icon}</span>}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </EnhancedCard>
    );
};

export default EnhancedCard;

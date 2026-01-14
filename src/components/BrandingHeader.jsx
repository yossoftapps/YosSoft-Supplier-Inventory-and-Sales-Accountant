import React from 'react';
import companyLogo from '../assets/images/logo.png';

const BrandingHeader = ({ style, isCompact = false, ...props }) => {
    return (
        <div style={{
            background: isCompact ? 'transparent' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: isCompact ? '0 12px' : '24px 32px',
            borderRadius: isCompact ? '0' : '16px',
            marginBottom: isCompact ? '0' : '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: isCompact ? 'inherit' : 'white',
            boxShadow: isCompact ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: isCompact ? 'none' : '1px solid rgba(255,255,255,0.1)',
            height: isCompact ? '64px' : 'auto',
            ...style
        }} {...props}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '8px' : '12px', marginBottom: isCompact ? '0' : '8px' }}>
                    <div style={{
                        width: isCompact ? '6px' : '8px',
                        height: isCompact ? '6px' : '8px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        boxShadow: '0 0 10px #2563eb'
                    }}></div>
                    <h1 style={{
                        color: isCompact ? 'inherit' : 'white',
                        margin: 0,
                        fontSize: isCompact ? '18px' : '24px',
                        fontWeight: 'bold',
                        letterSpacing: '-0.5px',
                        whiteSpace: 'nowrap'
                    }}>يوسوفت محاسب المخزون والموردين والمبيعات</h1>
                </div>
                {!isCompact && <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>نظام متكامل لإدارة الأعمال بكفاءة ودقة</p>}
            </div>
            {!isCompact && (
                <img
                    src={companyLogo}
                    alt="Company Logo"
                    style={{
                        height: '60px',
                        filter: 'drop-shadow(0 0 20px rgba(37, 99, 235, 0.3))',
                        transition: 'transform 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            )}
        </div>
    );
};

export default BrandingHeader;

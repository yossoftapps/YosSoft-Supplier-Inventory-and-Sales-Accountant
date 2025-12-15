import React from 'react';
import companyLogo from '../assets/images/logo.png';

const BrandingHeader = ({ style, ...props }) => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '24px 32px',
            borderRadius: '16px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            ...style
        }} {...props}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 10px #2563eb' }}></div>
                    <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>يوسوفت محاسب المخزون والموردين والمبيعات</h1>
                </div>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>نظام متكامل لإدارة الأعمال بكفاءة ودقة</p>
            </div>
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
        </div>
    );
};

export default BrandingHeader;

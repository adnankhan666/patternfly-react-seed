import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSection, Title } from '@patternfly/react-core';
import { DropText } from './DropText';
import './Dashboard.css';

const Dashboard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    // Auto-hide splash and navigate to canvas after 5 seconds (allowing time for animations)
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Navigate to canvas after splash fades out
      setTimeout(() => {
        navigate('/canvas');
      }, 500); // Give 500ms for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <div className="splash-overlay">
          <div className="splash-content">
            <DropText text="Welcome to Red AI" delay={100} />
            {/* Dust particles */}
            <div className="dust-container">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`dust-particle dust-${i + 1}`} />
              ))}
            </div>
          </div>
          <p className="splash-transition-text">Let's get started</p>
        </div>
      )}

      {/* Main Dashboard Content */}
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h1" size="lg">Dashboard Page Title!</Title>
      </PageSection>
    </>
  );
};

export { Dashboard };

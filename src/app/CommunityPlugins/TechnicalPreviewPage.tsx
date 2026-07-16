import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageSection,
  Title,
  Gallery,
  GalleryItem,
  Label,
  Flex,
  FlexItem,
  Content,
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import {
  BlueprintIcon,
  CheckCircleIcon,
} from '@patternfly/react-icons';
import { PluginBrowseSection } from './PluginBrowseSection';
import { CommunityPluginsBreadcrumb } from './CommunityPluginsBreadcrumb';
import { FeatureFlipCard, FeatureFlipCardData } from './FeatureFlipCard';

const TP_FEATURES: FeatureFlipCardData[] = [
  {
    id: 'genai',
    name: 'GenAI',
    description: 'Generative AI workflows with LLM orchestration, prompt management, and RAG pipelines.',
    icon: '\uD83E\uDD16',
    color: '#8b5cf6',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'Compose multi-step LLM workflows visually',
      'Built-in prompt templates and RAG connectors',
      'Guardrails and evaluation hooks included',
    ],
  },
  {
    id: 'evalhub',
    name: 'EvalHub',
    description: 'Model evaluation hub for benchmarking, A/B testing, and quality scoring.',
    icon: '\uD83D\uDCCA',
    color: '#06b6d4',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'Side-by-side model comparisons',
      'Custom scoring rubrics and datasets',
      'Exportable evaluation reports',
    ],
  },
  {
    id: 'kf-trainer',
    name: 'KF Trainer',
    description: 'Kubeflow Trainer integration for distributed training jobs on Kubernetes.',
    icon: '\uD83C\uDF93',
    color: '#f59e0b',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'One-click distributed training jobs',
      'GPU-aware scheduling presets',
      'Live training metrics on canvas',
    ],
  },
  {
    id: 'gpuaas',
    name: 'GPUaaS',
    description: 'GPU-as-a-Service for on-demand accelerator provisioning and scheduling.',
    icon: '\u26A1',
    color: '#10b981',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'On-demand GPU slices and pools',
      'Quota-aware team scheduling',
      'Cost visibility per workload',
    ],
  },
  {
    id: 'feature-store',
    name: 'Feature Store',
    description: 'Centralized feature repository for training and inference consistency.',
    icon: '\uD83D\uDDC3\uFE0F',
    color: '#6366f1',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'Online and offline feature serving',
      'Point-in-time correct joins',
      'Governance-ready lineage views',
    ],
  },
  {
    id: 'pipelines-v4',
    name: 'Pipelines v4',
    description: 'Next-generation pipeline engine with improved DAG execution and caching.',
    icon: '\uD83D\uDD04',
    color: '#ec4899',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'Faster DAG scheduling',
      'Smarter step caching',
      'Native retry and resume controls',
    ],
  },
  {
    id: 'vllm',
    name: 'vLLM',
    description: 'High-throughput LLM serving with vLLM-optimized inference runtimes.',
    icon: '\uD83D\uDE80',
    color: '#3b82f6',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'PagedAttention-optimized serving',
      'Auto-scaling inference endpoints',
      'OpenAI-compatible API surface',
    ],
  },
  {
    id: 'agent-catalog',
    name: 'Agent Catalog',
    description: 'Discover and deploy pre-built AI agents for common enterprise tasks.',
    icon: '\uD83E\uDD16',
    color: '#14b8a6',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'Curated enterprise agent recipes',
      'One-click deploy to canvas',
      'Tooling and MCP connectors ready',
    ],
  },
  {
    id: 'model-deployment',
    name: 'Model Deployment',
    description: 'Streamlined model deployment with canary rollouts and auto-scaling.',
    icon: '\uD83D\uDCE6',
    color: '#ef4444',
    badgeLabel: 'TP',
    badgeColor: 'purple',
    highlights: [
      'Canary and blue/green rollouts',
      'Traffic splitting controls',
      'Autoscaling with SLO targets',
    ],
  },
];

const TechnicalPreviewPage: React.FunctionComponent = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<string | number>(
    searchParams.get('tab') === 'plugins' ? 1 : 0
  );
  const [flippedId, setFlippedId] = React.useState<string | null>(null);
  const [accessRequested, setAccessRequested] = React.useState<string | null>(null);

  return (
    <PageSection hasBodyWrapper={false} style={{ paddingTop: '16px', paddingBottom: '16px' }}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <CommunityPluginsBreadcrumb items={[{ label: 'Technical Preview' }]} />
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Title headingLevel="h1" size="xl">
                <BlueprintIcon style={{ marginRight: '8px', color: '#6366f1' }} />
                Technical Preview
              </Title>
            </FlexItem>
            <FlexItem>
              <Label color="purple" isCompact>TP</Label>
            </FlexItem>
          </Flex>
          <Content>
            <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Explore technical preview capabilities and manage your deployed plugins
            </p>
          </Content>
        </FlexItem>

        {accessRequested && (
          <FlexItem>
            <Alert
              variant="success"
              title={`Early access requested for ${accessRequested}`}
              actionClose={<AlertActionCloseButton onClose={() => setAccessRequested(null)} />}
              isInline
            >
              We&apos;ll notify you when this feature becomes available for technical preview.
            </Alert>
          </FlexItem>
        )}

        <FlexItem>
          <Tabs
            activeKey={activeTab}
            onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
            aria-label="Technical preview tabs"
          >
            <Tab eventKey={0} title={<TabTitleText>Upcoming Features</TabTitleText>}>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} style={{ marginTop: '12px' }}>
                <FlexItem>
                  <Content>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                      Click a card to flip it and request early access
                    </p>
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Gallery hasGutter minWidths={{ default: '240px' }} maxWidths={{ default: '1fr' }}>
                    {TP_FEATURES.map((feature) => (
                      <GalleryItem key={feature.id}>
                        <FeatureFlipCard
                          feature={feature}
                          isFlipped={flippedId === feature.id}
                          onFlip={() => setFlippedId((prev) => (prev === feature.id ? null : feature.id))}
                          onRequestAccess={() => setAccessRequested(feature.name)}
                        />
                      </GalleryItem>
                    ))}
                  </Gallery>
                </FlexItem>
              </Flex>
            </Tab>
            <Tab eventKey={1} title={<TabTitleText><CheckCircleIcon style={{ marginRight: '6px' }} />Deployed Plugins</TabTitleText>}>
              <div style={{ marginTop: '12px' }}>
                <PluginBrowseSection showSectionHeader={false} deployedOnly />
              </div>
            </Tab>
          </Tabs>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export { TechnicalPreviewPage };

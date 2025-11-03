import * as React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Grid,
  GridItem,
  Flex,
  FlexItem,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartGroup,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
  ChartDonut,
  ChartLegend,
} from '@patternfly/react-charts/victory';
import { mockTelemetryData } from '../../data/mockTelemetry';

const Telemetry: React.FunctionComponent = () => {
  const { systemMetrics, workflowMetrics, userActivity, nodeStatistics } = mockTelemetryData;

  // Format historical data for charts
  const cpuData = systemMetrics.historical.map((metric, i) => ({ x: i, y: metric.cpuUsage, name: 'CPU' }));
  const memoryData = systemMetrics.historical.map((metric, i) => ({ x: i, y: metric.memoryUsage, name: 'Memory' }));
  const networkData = systemMetrics.historical.map((metric, i) => ({ x: i, y: metric.networkIO / 10, name: 'Network (MB/s)' }));

  const executionTimeData = workflowMetrics.historical.map((metric, i) => ({ x: i, y: metric.executionDuration / 1000 }));
  const successRateData = workflowMetrics.historical.map((metric, i) => ({ x: i, y: metric.successRate }));

  return (
    <PageSection>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
        {/* Page Header */}
        <FlexItem>
          <Title headingLevel="h1" size="2xl">
            Telemetry Dashboard
          </Title>
          <Content component={ContentVariants.p} style={{ color: '#6b7280', marginTop: '8px' }}>
            Monitor system performance, workflow metrics, and user activity in real-time
          </Content>
        </FlexItem>

        {/* System Metrics Cards */}
        <FlexItem>
          <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
            System Overview
          </Title>
          <Grid hasGutter>
            <GridItem span={3}>
              <Card isCompact>
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                        CPU Usage
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.h1} style={{ fontSize: '2.5rem', fontWeight: 700, color: '#06b6d4' }}>
                        {systemMetrics.current.cpuUsage.toFixed(1)}%
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#10b981' }}>
                        ↑ 5.2% from last hour
                      </Content>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={3}>
              <Card isCompact>
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                        Memory Usage
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.h1} style={{ fontSize: '2.5rem', fontWeight: 700, color: '#8b5cf6' }}>
                        {systemMetrics.current.memoryUsage.toFixed(1)}%
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#10b981' }}>
                        ↓ 2.3% from last hour
                      </Content>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={3}>
              <Card isCompact>
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                        Active Workflows
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.h1} style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>
                        {systemMetrics.current.activeWorkflows}
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#6b7280' }}>
                        Currently running
                      </Content>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem span={3}>
              <Card isCompact>
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                        Total Executions
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.h1} style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b' }}>
                        {systemMetrics.current.totalExecutions.toLocaleString()}
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Content component={ContentVariants.small} style={{ color: '#6b7280' }}>
                        All time
                      </Content>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </FlexItem>

        {/* Charts */}
        <FlexItem>
          <Grid hasGutter>
            {/* System Resource Usage Chart */}
            <GridItem span={8}>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                    System Resource Usage (Last 24 Hours)
                  </Title>
                  <div style={{ height: 300 }}>
                    <Chart
                      ariaDesc="System resource usage over time"
                      ariaTitle="Resource usage chart"
                      containerComponent={<ChartVoronoiContainer labels={({ datum }) => `${datum.name}: ${datum.y.toFixed(1)}${datum.name === 'Network (MB/s)' ? ' MB/s' : '%'}`} constrainToVisibleArea />}
                      height={300}
                      padding={{
                        bottom: 50,
                        left: 60,
                        right: 20,
                        top: 20,
                      }}
                      maxDomain={{ y: 100 }}
                      themeColor={ChartThemeColor.multiOrdered}
                    >
                      <ChartAxis />
                      <ChartAxis dependentAxis showGrid />
                      <ChartGroup>
                        <ChartLine data={cpuData} />
                        <ChartLine data={memoryData} />
                      </ChartGroup>
                    </Chart>
                  </div>
                </CardBody>
              </Card>
            </GridItem>

            {/* Workflow Success/Failure Rate */}
            <GridItem span={4}>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                    Workflow Success Rate
                  </Title>
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChartDonut
                      ariaDesc="Workflow success and failure rates"
                      ariaTitle="Success rate donut chart"
                      constrainToVisibleArea
                      data={[
                        { x: 'Success', y: workflowMetrics.successRate },
                        { x: 'Failure', y: workflowMetrics.failureRate },
                      ]}
                      labels={({ datum }) => `${datum.x}: ${datum.y.toFixed(1)}%`}
                      legendData={[
                        { name: `Success: ${workflowMetrics.successRate.toFixed(1)}%` },
                        { name: `Failure: ${workflowMetrics.failureRate.toFixed(1)}%` },
                      ]}
                      legendOrientation="vertical"
                      legendPosition="right"
                      padding={{
                        bottom: 20,
                        left: 20,
                        right: 140,
                        top: 20,
                      }}
                      subTitle="Success Rate"
                      title={`${workflowMetrics.successRate.toFixed(1)}%`}
                      width={350}
                      height={230}
                      colorScale={['#10b981', '#ef4444']}
                    />
                  </div>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </FlexItem>

        {/* User Activity & Node Statistics */}
        <FlexItem>
          <Grid hasGutter>
            {/* User Activity */}
            <GridItem span={4}>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '24px' }}>
                    User Activity
                  </Title>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    <FlexItem>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ color: '#6b7280' }}>Active Users</Content>
                        </FlexItem>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                            {userActivity.activeUsers}
                          </Content>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ color: '#6b7280' }}>Total Sessions</Content>
                        </FlexItem>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                            {userActivity.totalSessions}
                          </Content>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ color: '#6b7280' }}>Projects Created</Content>
                        </FlexItem>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                            {userActivity.projectsCreated}
                          </Content>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ color: '#6b7280' }}>Workflows Deployed</Content>
                        </FlexItem>
                        <FlexItem>
                          <Content component={ContentVariants.p} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                            {userActivity.workflowsDeployed}
                          </Content>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>

            {/* Most Used Nodes */}
            <GridItem span={8}>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                    Most Used Nodes
                  </Title>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    {nodeStatistics.map((node) => {
                      const maxCount = Math.max(...nodeStatistics.map((n) => n.count));
                      const percentage = (node.count / maxCount) * 100;

                      return (
                        <FlexItem key={node.nodeType}>
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                            <FlexItem>
                              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                                <FlexItem>
                                  <Content component={ContentVariants.p} style={{ fontWeight: 500 }}>{node.nodeType}</Content>
                                </FlexItem>
                                <FlexItem>
                                  <Content component={ContentVariants.p} style={{ fontWeight: 700, color: node.color }}>
                                    {node.count}
                                  </Content>
                                </FlexItem>
                              </Flex>
                            </FlexItem>
                            <FlexItem>
                              <div style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: node.color,
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease',
                                }} />
                              </div>
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      );
                    })}
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </FlexItem>

        {/* Average Execution Time Chart */}
        <FlexItem>
          <Card>
            <CardBody>
              <Title headingLevel="h3" size="lg" style={{ marginBottom: '16px' }}>
                Average Workflow Execution Time (Last 24 Hours)
              </Title>
              <div style={{ height: 250 }}>
                <Chart
                  ariaDesc="Average workflow execution time"
                  ariaTitle="Execution time chart"
                  containerComponent={<ChartVoronoiContainer labels={({ datum }) => `${datum.y.toFixed(2)}s`} constrainToVisibleArea />}
                  height={250}
                  padding={{
                    bottom: 50,
                    left: 60,
                    right: 20,
                    top: 20,
                  }}
                  themeColor={ChartThemeColor.green}
                >
                  <ChartAxis />
                  <ChartAxis dependentAxis showGrid label="Seconds" />
                  <ChartGroup>
                    <ChartLine data={executionTimeData} />
                  </ChartGroup>
                </Chart>
              </div>
            </CardBody>
          </Card>
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export { Telemetry };

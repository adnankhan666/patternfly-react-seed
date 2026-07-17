import * as React from 'react';
import {
  Button,
  Checkbox,
  Flex,
  FlexItem,
  FormGroup,
  TextArea,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Label,
  Alert,
} from '@patternfly/react-core';
import { ThumbsUpIcon, CheckCircleIcon, EditIcon } from '@patternfly/react-icons';
import {
  FeatureInterest,
  FeaturePriority,
  getFeatureInterest,
  getInterestCount,
  saveFeatureInterest,
  toggleVote,
} from '../../data/featureInterestStore';
import { FeatureFlipCardData } from '../../data/previewFeatures';
import './FeatureFeedbackPanel.css';

interface FeatureFeedbackPanelProps {
  feature: FeatureFlipCardData;
  onInterestChange?: () => void;
}

const PRIORITY_LABELS: Record<Exclude<FeaturePriority, null>, string> = {
  'must-have': 'Must-have',
  'nice-to-have': 'Nice-to-have',
  exploring: 'Just exploring',
};

const FeatureFeedbackPanel: React.FunctionComponent<FeatureFeedbackPanelProps> = ({
  feature,
  onInterestChange,
}) => {
  const [interest, setInterest] = React.useState<FeatureInterest>(() => getFeatureInterest(feature.id));
  const [isEditing, setIsEditing] = React.useState(false);
  const [priority, setPriority] = React.useState<FeaturePriority>(interest.priority);
  const [selectedUseCases, setSelectedUseCases] = React.useState<string[]>(interest.selectedUseCases);
  const [comment, setComment] = React.useState(interest.comment);

  React.useEffect(() => {
    const next = getFeatureInterest(feature.id);
    setInterest(next);
    setPriority(next.priority);
    setSelectedUseCases(next.selectedUseCases);
    setComment(next.comment);
    setIsEditing(false);
  }, [feature.id]);

  const interestCount = getInterestCount(feature.id, feature.baseInterestCount);
  const showSubmitted = Boolean(interest.submittedAt) && !isEditing && Boolean(interest.priority || interest.comment || interest.selectedUseCases.length);

  const notify = () => onInterestChange?.();

  const handleVote = () => {
    const next = toggleVote(feature.id);
    setInterest(next);
    notify();
  };

  const handleUseCaseToggle = (useCase: string, checked: boolean) => {
    setSelectedUseCases((prev) =>
      checked ? [...prev, useCase] : prev.filter((u) => u !== useCase)
    );
  };

  const handleSubmit = () => {
    const next: FeatureInterest = {
      voted: true,
      priority,
      selectedUseCases,
      comment: comment.trim(),
      submittedAt: new Date().toISOString(),
    };
    saveFeatureInterest(feature.id, next);
    setInterest(next);
    setIsEditing(false);
    notify();
  };

  const handleEdit = () => {
    setPriority(interest.priority);
    setSelectedUseCases(interest.selectedUseCases);
    setComment(interest.comment);
    setIsEditing(true);
  };

  if (showSubmitted) {
    return (
      <div className="feature-feedback-panel feature-feedback-panel--submitted">
        <Alert variant="success" isInline title="Thanks for your feedback" customIcon={<CheckCircleIcon />}>
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} style={{ marginTop: '8px' }}>
            <FlexItem>
              <span className="feature-feedback-panel__summary-label">Interest</span>
              <div>{interest.voted ? `Voted · ${interestCount} interested` : 'Not voted'}</div>
            </FlexItem>
            {interest.priority && (
              <FlexItem>
                <span className="feature-feedback-panel__summary-label">Priority</span>
                <div>
                  <Label color="blue" isCompact>{PRIORITY_LABELS[interest.priority]}</Label>
                </div>
              </FlexItem>
            )}
            {interest.selectedUseCases.length > 0 && (
              <FlexItem>
                <span className="feature-feedback-panel__summary-label">Use cases</span>
                <ul className="feature-feedback-panel__summary-list">
                  {interest.selectedUseCases.map((uc) => (
                    <li key={uc}>{uc}</li>
                  ))}
                </ul>
              </FlexItem>
            )}
            {interest.comment && (
              <FlexItem>
                <span className="feature-feedback-panel__summary-label">Comment</span>
                <div className="feature-feedback-panel__comment-preview">{interest.comment}</div>
              </FlexItem>
            )}
            <FlexItem>
              <Button variant="link" isInline icon={<EditIcon />} onClick={handleEdit}>
                Edit feedback
              </Button>
            </FlexItem>
          </Flex>
        </Alert>
      </div>
    );
  }

  return (
    <div className="feature-feedback-panel">
      <Title headingLevel="h3" size="md" style={{ marginBottom: '12px' }}>
        Interest &amp; feedback
      </Title>

      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <Button
            variant={interest.voted ? 'secondary' : 'primary'}
            icon={<ThumbsUpIcon />}
            onClick={handleVote}
          >
            {interest.voted ? 'You voted' : 'I\'m interested'} · {interestCount}
          </Button>
        </FlexItem>

        <FlexItem>
          <FormGroup label="How important is this to you?" fieldId={`${feature.id}-priority`}>
            <ToggleGroup aria-label="Feature priority">
              <ToggleGroupItem
                text="Must-have"
                buttonId={`${feature.id}-must-have`}
                isSelected={priority === 'must-have'}
                onChange={() => setPriority('must-have')}
              />
              <ToggleGroupItem
                text="Nice-to-have"
                buttonId={`${feature.id}-nice-to-have`}
                isSelected={priority === 'nice-to-have'}
                onChange={() => setPriority('nice-to-have')}
              />
              <ToggleGroupItem
                text="Just exploring"
                buttonId={`${feature.id}-exploring`}
                isSelected={priority === 'exploring'}
                onChange={() => setPriority('exploring')}
              />
            </ToggleGroup>
          </FormGroup>
        </FlexItem>

        <FlexItem>
          <FormGroup label="Which use cases apply?" fieldId={`${feature.id}-use-cases`}>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
              {feature.useCases.map((useCase, index) => (
                <Checkbox
                  key={useCase}
                  id={`${feature.id}-uc-${index}`}
                  label={useCase}
                  isChecked={selectedUseCases.includes(useCase)}
                  onChange={(_e, checked) => handleUseCaseToggle(useCase, checked)}
                />
              ))}
            </Flex>
          </FormGroup>
        </FlexItem>

        <FlexItem>
          <FormGroup label="How would you use this feature?" fieldId={`${feature.id}-comment`}>
            <TextArea
              id={`${feature.id}-comment`}
              value={comment}
              onChange={(_e, val) => setComment(val)}
              resizeOrientation="vertical"
              rows={3}
              placeholder="Optional — tell us about your scenario..."
              aria-label="Feature feedback comment"
            />
          </FormGroup>
        </FlexItem>

        <FlexItem>
          <Flex gap={{ default: 'gapSm' }}>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isDisabled={!priority && selectedUseCases.length === 0 && !comment.trim()}
            >
              Submit feedback
            </Button>
            {isEditing && (
              <Button variant="link" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </Flex>
        </FlexItem>
      </Flex>
    </div>
  );
};

export { FeatureFeedbackPanel };

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { StatementData, ConformanceStatus, WCAGLevel } from '@/lib/statement/types';
import { validateStatementData, isValidEmail, isValidUrl } from '@/lib/statement/utils';

interface StatementCustomizationFormProps {
  onGenerate: (data: StatementData) => void;
  initialData?: Partial<StatementData>;
}

interface FormErrors {
  [key: string]: string;
}

const STORAGE_KEY = 'accessibility-statement-draft';

export function StatementCustomizationForm({ onGenerate, initialData }: StatementCustomizationFormProps) {
  const { t } = useTranslation();
  
  // Form state
  const [organizationName, setOrganizationName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [feedbackUrl, setFeedbackUrl] = useState('');
  const [responseTime, setResponseTime] = useState('3 business days');
  
  const [conformanceStatus, setConformanceStatus] = useState<ConformanceStatus>('partial');
  const [wcagLevel, setWcagLevel] = useState<WCAGLevel>('AA');
  const [wcagVersion, setWcagVersion] = useState('2.2');
  
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastReviewDate, setLastReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [approver, setApprover] = useState('');
  
  const [mobileAppIncluded, setMobileAppIncluded] = useState(false);
  const [pdfDocumentsIncluded, setPdfDocumentsIncluded] = useState(false);
  const [hasThirdPartyContent, setHasThirdPartyContent] = useState(false);
  const [thirdPartyDescription, setThirdPartyDescription] = useState('');
  const [thirdPartyProviders, setThirdPartyProviders] = useState('');
  
  const [hasDisproportionateBurden, setHasDisproportionateBurden] = useState(false);
  const [disproportionateBurdenExplanation, setDisproportionateBurdenExplanation] = useState('');
  const [disproportionateBurdenJustification, setDisproportionateBurdenJustification] = useState('');
  
  const [limitations, setLimitations] = useState('');
  const [plannedImprovements, setPlannedImprovements] = useState('');
  const [customIntro, setCustomIntro] = useState('');
  const [customOutro, setCustomOutro] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  const [assessmentMethod, setAssessmentMethod] = useState<'self' | 'external' | 'both'>('self');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [assessor, setAssessor] = useState('');
  const [assessmentTools, setAssessmentTools] = useState('axe DevTools, WAVE, Manual testing');
  const [assessmentScope, setAssessmentScope] = useState('');
  
  const [technologies, setTechnologies] = useState('HTML5, CSS3, JavaScript, WAI-ARIA');
  const [browsers, setBrowsers] = useState('Chrome 120+, Firefox 121+, Safari 17+, Edge 120+');
  const [assistiveTechnologies, setAssistiveTechnologies] = useState('NVDA, JAWS, VoiceOver');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showValidation, setShowValidation] = useState(false);
  
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        populateFormFromData(data);
      } catch (e) {
        console.error('Failed to load draft from localStorage:', e);
      }
    }
    
    // Populate from initialData if provided
    if (initialData) {
      populateFormFromData(initialData);
    }
  }, [initialData]);
  
  // Save to localStorage on changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const data = buildStatementData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 1000); // Debounce 1 second
    
    return () => clearTimeout(timeoutId);
  }, [
    organizationName, websiteUrl, contactEmail, contactPhone, feedbackUrl,
    conformanceStatus, wcagLevel, wcagVersion, statementDate, lastReviewDate,
    nextReviewDate, limitations, plannedImprovements, assessmentMethod,
    assessmentDate, technologies, browsers
  ]);
  
  const populateFormFromData = (data: Partial<StatementData>) => {
    if (data.metadata) {
      setOrganizationName(data.metadata.organizationName || '');
      setWebsiteUrl(data.metadata.websiteUrl || '');
      setStatementDate(data.metadata.statementDate || new Date().toISOString().split('T')[0]);
      setLastReviewDate(data.metadata.lastReviewDate || new Date().toISOString().split('T')[0]);
      setNextReviewDate(data.metadata.nextReviewDate || '');
      setApprover(data.metadata.approver || '');
    }
    
    if (data.contact) {
      setContactEmail(data.contact.email || '');
      setContactPhone(data.contact.phone || '');
      setFeedbackUrl(data.contact.feedbackUrl || '');
      setResponseTime(data.contact.responseTime || '3 business days');
    }
    
    if (data.conformance) {
      setConformanceStatus(data.conformance.status);
      setWcagLevel(data.conformance.wcagLevel);
      setWcagVersion(data.conformance.wcagVersion);
    }
    
    if (data.assessment) {
      setAssessmentMethod(data.assessment.method);
      setAssessmentDate(data.assessment.assessmentDate);
      setAssessor(data.assessment.assessor || '');
      setAssessmentTools(data.assessment.tools?.join(', ') || '');
      setAssessmentScope(data.assessment.scope || '');
    }
    
    if (data.technicalSpecs) {
      setTechnologies(data.technicalSpecs.technologies.join(', '));
      setBrowsers(data.technicalSpecs.browsers.join(', '));
      setAssistiveTechnologies(data.technicalSpecs.assistiveTechnologies?.join(', ') || '');
    }
    
    setMobileAppIncluded(data.mobileAppIncluded || false);
    setPdfDocumentsIncluded(data.pdfDocumentsIncluded || false);
    
    if (data.thirdPartyContent) {
      setHasThirdPartyContent(data.thirdPartyContent.hasThirdPartyContent);
      setThirdPartyDescription(data.thirdPartyContent.description || '');
      setThirdPartyProviders(data.thirdPartyContent.providers?.join(', ') || '');
    }
    
    if (data.disproportionateBurden) {
      setHasDisproportionateBurden(data.disproportionateBurden.hasDisproportionateBurden);
      setDisproportionateBurdenExplanation(data.disproportionateBurden.explanation || '');
      setDisproportionateBurdenJustification(data.disproportionateBurden.justification || '');
    }
    
    setCustomIntro(data.customIntro || '');
    setCustomOutro(data.customOutro || '');
    setAdditionalInfo(data.additionalInfo || '');
  };
  
  const buildStatementData = (): StatementData => {
    const locale = document.documentElement.lang === 'sv' ? 'sv-SE' : 'en-US';
    
    return {
      metadata: {
        organizationName,
        websiteUrl,
        statementDate,
        lastReviewDate,
        nextReviewDate: nextReviewDate || undefined,
        locale: locale as 'sv-SE' | 'en-US',
        approver: approver || undefined
      },
      contact: {
        email: contactEmail,
        phone: contactPhone || undefined,
        feedbackUrl: feedbackUrl || undefined,
        responseTime: responseTime || undefined
      },
      conformance: {
        status: conformanceStatus,
        wcagLevel,
        wcagVersion
      },
      limitations: limitations.trim() ? limitations.split('\n').filter(l => l.trim()).map(line => ({
        title: line.trim().split(':')[0] || line.trim(),
        description: line.trim().split(':')[1]?.trim() || line.trim()
      })) : [],
      disproportionateBurden: hasDisproportionateBurden ? {
        hasDisproportionateBurden: true,
        explanation: disproportionateBurdenExplanation,
        justification: disproportionateBurdenJustification || undefined
      } : undefined,
      technicalSpecs: {
        technologies: technologies.split(',').map(t => t.trim()).filter(Boolean),
        browsers: browsers.split(',').map(b => b.trim()).filter(Boolean),
        assistiveTechnologies: assistiveTechnologies ? assistiveTechnologies.split(',').map(a => a.trim()).filter(Boolean) : undefined
      },
      assessment: {
        method: assessmentMethod,
        assessmentDate,
        assessor: assessor || undefined,
        tools: assessmentTools ? assessmentTools.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        scope: assessmentScope || undefined
      },
      mobileAppIncluded,
      pdfDocumentsIncluded,
      thirdPartyContent: hasThirdPartyContent ? {
        hasThirdPartyContent: true,
        description: thirdPartyDescription || undefined,
        providers: thirdPartyProviders ? thirdPartyProviders.split(',').map(p => p.trim()).filter(Boolean) : undefined
      } : undefined,
      customIntro: customIntro || undefined,
      customOutro: customOutro || undefined,
      additionalInfo: additionalInfo || undefined
    };
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!organizationName.trim()) {
      newErrors.organizationName = t('statement.form.errors.organizationRequired');
    }
    
    if (!websiteUrl.trim()) {
      newErrors.websiteUrl = t('statement.form.errors.websiteRequired');
    } else if (!isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = t('statement.form.errors.websiteInvalid');
    }
    
    if (!contactEmail.trim()) {
      newErrors.contactEmail = t('statement.form.errors.emailRequired');
    } else if (!isValidEmail(contactEmail)) {
      newErrors.contactEmail = t('statement.form.errors.emailInvalid');
    }
    
    if (feedbackUrl && !isValidUrl(feedbackUrl)) {
      newErrors.feedbackUrl = t('statement.form.errors.urlInvalid');
    }
    
    if (!technologies.trim()) {
      newErrors.technologies = t('statement.form.errors.technologiesRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      return;
    }
    
    const data = buildStatementData();
    const validation = validateStatementData(data);
    
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      setErrors({ form: validation.errors.join(', ') });
      return;
    }
    
    onGenerate(data);
  };
  
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label={t('statement.form.title')}>
      {showValidation && Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('statement.form.errors.fixErrors')}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization">{t('statement.form.tabs.organization')}</TabsTrigger>
          <TabsTrigger value="conformance">{t('statement.form.tabs.conformance')}</TabsTrigger>
          <TabsTrigger value="technical">{t('statement.form.tabs.technical')}</TabsTrigger>
          <TabsTrigger value="additional">{t('statement.form.tabs.additional')}</TabsTrigger>
        </TabsList>
        
        {/* Organization Info Tab */}
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.organization.title')}</CardTitle>
              <CardDescription>{t('statement.form.organization.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="required">
                  {t('statement.form.organization.name')}
                </Label>
                <Input
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!errors.organizationName}
                  aria-describedby={errors.organizationName ? 'organizationName-error' : undefined}
                />
                {showValidation && errors.organizationName && (
                  <p id="organizationName-error" className="text-sm text-destructive" role="alert">
                    {errors.organizationName}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="required">
                  {t('statement.form.organization.websiteUrl')}
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.websiteUrl}
                  aria-describedby={errors.websiteUrl ? 'websiteUrl-error' : undefined}
                />
                {showValidation && errors.websiteUrl && (
                  <p id="websiteUrl-error" className="text-sm text-destructive" role="alert">
                    {errors.websiteUrl}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="required">
                  {t('statement.form.organization.contactEmail')}
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="accessibility@example.com"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.contactEmail}
                  aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
                />
                {showValidation && errors.contactEmail && (
                  <p id="contactEmail-error" className="text-sm text-destructive" role="alert">
                    {errors.contactEmail}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  {t('statement.form.organization.contactPhone')} {t('common.optional')}
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+46 123 456 789"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedbackUrl">
                  {t('statement.form.organization.feedbackUrl')} {t('common.optional')}
                </Label>
                <Input
                  id="feedbackUrl"
                  type="url"
                  value={feedbackUrl}
                  onChange={(e) => setFeedbackUrl(e.target.value)}
                  placeholder="https://example.com/feedback"
                  aria-invalid={!!errors.feedbackUrl}
                  aria-describedby={errors.feedbackUrl ? 'feedbackUrl-error' : undefined}
                />
                {showValidation && errors.feedbackUrl && (
                  <p id="feedbackUrl-error" className="text-sm text-destructive" role="alert">
                    {errors.feedbackUrl}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responseTime">
                  {t('statement.form.organization.responseTime')}
                </Label>
                <Input
                  id="responseTime"
                  value={responseTime}
                  onChange={(e) => setResponseTime(e.target.value)}
                  placeholder="3 business days"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.dates.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statementDate" className="required">
                    {t('statement.form.dates.statementDate')}
                  </Label>
                  <Input
                    id="statementDate"
                    type="date"
                    value={statementDate}
                    onChange={(e) => setStatementDate(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastReviewDate" className="required">
                    {t('statement.form.dates.lastReviewDate')}
                  </Label>
                  <Input
                    id="lastReviewDate"
                    type="date"
                    value={lastReviewDate}
                    onChange={(e) => setLastReviewDate(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nextReviewDate">
                    {t('statement.form.dates.nextReviewDate')} {t('common.optional')}
                  </Label>
                  <Input
                    id="nextReviewDate"
                    type="date"
                    value={nextReviewDate}
                    onChange={(e) => setNextReviewDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="approver">
                  {t('statement.form.dates.approver')} {t('common.optional')}
                </Label>
                <Input
                  id="approver"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder={t('statement.form.dates.approverPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Conformance Tab */}
        <TabsContent value="conformance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.conformance.title')}</CardTitle>
              <CardDescription>{t('statement.form.conformance.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conformanceStatus">
                    {t('statement.form.conformance.status')}
                  </Label>
                  <Select value={conformanceStatus} onValueChange={(v) => setConformanceStatus(v as ConformanceStatus)}>
                    <SelectTrigger id="conformanceStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">{t('statement.form.conformance.statusFull')}</SelectItem>
                      <SelectItem value="partial">{t('statement.form.conformance.statusPartial')}</SelectItem>
                      <SelectItem value="non-conformant">{t('statement.form.conformance.statusNon')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wcagLevel">
                    {t('statement.form.conformance.wcagLevel')}
                  </Label>
                  <Select value={wcagLevel} onValueChange={(v) => setWcagLevel(v as WCAGLevel)}>
                    <SelectTrigger id="wcagLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Level A</SelectItem>
                      <SelectItem value="AA">Level AA</SelectItem>
                      <SelectItem value="AAA">Level AAA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wcagVersion">
                    {t('statement.form.conformance.wcagVersion')}
                  </Label>
                  <Select value={wcagVersion} onValueChange={setWcagVersion}>
                    <SelectTrigger id="wcagVersion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2.1">WCAG 2.1</SelectItem>
                      <SelectItem value="2.2">WCAG 2.2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limitations">
                  {t('statement.form.conformance.limitations')}
                </Label>
                <Textarea
                  id="limitations"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  rows={5}
                  placeholder={t('statement.form.conformance.limitationsPlaceholder')}
                  aria-describedby="limitations-help"
                />
                <p id="limitations-help" className="text-sm text-muted-foreground">
                  {t('statement.form.conformance.limitationsHelp')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plannedImprovements">
                  {t('statement.form.conformance.plannedImprovements')} {t('common.optional')}
                </Label>
                <Textarea
                  id="plannedImprovements"
                  value={plannedImprovements}
                  onChange={(e) => setPlannedImprovements(e.target.value)}
                  rows={4}
                  placeholder={t('statement.form.conformance.improvementsPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.assessment.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assessmentMethod">
                    {t('statement.form.assessment.method')}
                  </Label>
                  <Select value={assessmentMethod} onValueChange={(v) => setAssessmentMethod(v as typeof assessmentMethod)}>
                    <SelectTrigger id="assessmentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">{t('statement.form.assessment.methodSelf')}</SelectItem>
                      <SelectItem value="external">{t('statement.form.assessment.methodExternal')}</SelectItem>
                      <SelectItem value="both">{t('statement.form.assessment.methodBoth')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assessmentDate">
                    {t('statement.form.assessment.date')}
                  </Label>
                  <Input
                    id="assessmentDate"
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assessor">
                  {t('statement.form.assessment.assessor')} {t('common.optional')}
                </Label>
                <Input
                  id="assessor"
                  value={assessor}
                  onChange={(e) => setAssessor(e.target.value)}
                  placeholder={t('statement.form.assessment.assessorPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assessmentTools">
                  {t('statement.form.assessment.tools')} {t('common.optional')}
                </Label>
                <Input
                  id="assessmentTools"
                  value={assessmentTools}
                  onChange={(e) => setAssessmentTools(e.target.value)}
                  placeholder="axe DevTools, WAVE, Manual testing"
                  aria-describedby="tools-help"
                />
                <p id="tools-help" className="text-sm text-muted-foreground">
                  {t('statement.form.assessment.toolsHelp')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assessmentScope">
                  {t('statement.form.assessment.scope')} {t('common.optional')}
                </Label>
                <Textarea
                  id="assessmentScope"
                  value={assessmentScope}
                  onChange={(e) => setAssessmentScope(e.target.value)}
                  rows={3}
                  placeholder={t('statement.form.assessment.scopePlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.technical.title')}</CardTitle>
              <CardDescription>{t('statement.form.technical.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="technologies" className="required">
                  {t('statement.form.technical.technologies')}
                </Label>
                <Input
                  id="technologies"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="HTML5, CSS3, JavaScript, WAI-ARIA"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.technologies}
                  aria-describedby="technologies-help"
                />
                <p id="technologies-help" className="text-sm text-muted-foreground">
                  {t('statement.form.technical.technologiesHelp')}
                </p>
                {showValidation && errors.technologies && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.technologies}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="browsers">
                  {t('statement.form.technical.browsers')}
                </Label>
                <Input
                  id="browsers"
                  value={browsers}
                  onChange={(e) => setBrowsers(e.target.value)}
                  placeholder="Chrome 120+, Firefox 121+, Safari 17+, Edge 120+"
                  aria-describedby="browsers-help"
                />
                <p id="browsers-help" className="text-sm text-muted-foreground">
                  {t('statement.form.technical.browsersHelp')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assistiveTechnologies">
                  {t('statement.form.technical.assistive')} {t('common.optional')}
                </Label>
                <Input
                  id="assistiveTechnologies"
                  value={assistiveTechnologies}
                  onChange={(e) => setAssistiveTechnologies(e.target.value)}
                  placeholder="NVDA, JAWS, VoiceOver"
                  aria-describedby="assistive-help"
                />
                <p id="assistive-help" className="text-sm text-muted-foreground">
                  {t('statement.form.technical.assistiveHelp')}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.contentTypes.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mobileAppIncluded">
                    {t('statement.form.contentTypes.mobileApp')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('statement.form.contentTypes.mobileAppHelp')}
                  </p>
                </div>
                <Switch
                  id="mobileAppIncluded"
                  checked={mobileAppIncluded}
                  onCheckedChange={setMobileAppIncluded}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pdfDocumentsIncluded">
                    {t('statement.form.contentTypes.pdfDocuments')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('statement.form.contentTypes.pdfHelp')}
                  </p>
                </div>
                <Switch
                  id="pdfDocumentsIncluded"
                  checked={pdfDocumentsIncluded}
                  onCheckedChange={setPdfDocumentsIncluded}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasThirdPartyContent">
                    {t('statement.form.contentTypes.thirdParty')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('statement.form.contentTypes.thirdPartyHelp')}
                  </p>
                </div>
                <Switch
                  id="hasThirdPartyContent"
                  checked={hasThirdPartyContent}
                  onCheckedChange={setHasThirdPartyContent}
                />
              </div>
              
              {hasThirdPartyContent && (
                <>
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="thirdPartyDescription">
                      {t('statement.form.contentTypes.thirdPartyDescription')}
                    </Label>
                    <Textarea
                      id="thirdPartyDescription"
                      value={thirdPartyDescription}
                      onChange={(e) => setThirdPartyDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="thirdPartyProviders">
                      {t('statement.form.contentTypes.thirdPartyProviders')}
                    </Label>
                    <Input
                      id="thirdPartyProviders"
                      value={thirdPartyProviders}
                      onChange={(e) => setThirdPartyProviders(e.target.value)}
                      placeholder="YouTube, Google Maps, Twitter"
                      aria-describedby="providers-help"
                    />
                    <p id="providers-help" className="text-sm text-muted-foreground">
                      {t('statement.form.contentTypes.providersHelp')}
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasDisproportionateBurden">
                    {t('statement.form.contentTypes.disproportionateBurden')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('statement.form.contentTypes.burdenHelp')}
                  </p>
                </div>
                <Switch
                  id="hasDisproportionateBurden"
                  checked={hasDisproportionateBurden}
                  onCheckedChange={setHasDisproportionateBurden}
                />
              </div>
              
              {hasDisproportionateBurden && (
                <>
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="disproportionateBurdenExplanation">
                      {t('statement.form.contentTypes.burdenExplanation')}
                    </Label>
                    <Textarea
                      id="disproportionateBurdenExplanation"
                      value={disproportionateBurdenExplanation}
                      onChange={(e) => setDisproportionateBurdenExplanation(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="disproportionateBurdenJustification">
                      {t('statement.form.contentTypes.burdenJustification')} {t('common.optional')}
                    </Label>
                    <Textarea
                      id="disproportionateBurdenJustification"
                      value={disproportionateBurdenJustification}
                      onChange={(e) => setDisproportionateBurdenJustification(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Additional Tab */}
        <TabsContent value="additional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statement.form.customization.title')}</CardTitle>
              <CardDescription>{t('statement.form.customization.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customIntro">
                  {t('statement.form.customization.intro')} {t('common.optional')}
                </Label>
                <Textarea
                  id="customIntro"
                  value={customIntro}
                  onChange={(e) => setCustomIntro(e.target.value)}
                  rows={4}
                  placeholder={t('statement.form.customization.introPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customOutro">
                  {t('statement.form.customization.outro')} {t('common.optional')}
                </Label>
                <Textarea
                  id="customOutro"
                  value={customOutro}
                  onChange={(e) => setCustomOutro(e.target.value)}
                  rows={4}
                  placeholder={t('statement.form.customization.outroPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">
                  {t('statement.form.customization.additionalInfo')} {t('common.optional')}
                </Label>
                <Textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                  placeholder={t('statement.form.customization.additionalPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center justify-between pt-6 border-t">
        <Button type="button" variant="outline" onClick={clearDraft}>
          {t('statement.form.clearDraft')}
        </Button>
        <Button type="submit">
          {t('statement.form.generate')}
        </Button>
      </div>
    </form>
  );
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TrustCenterDataContext = createContext();

const TC_BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}trust-center`
  : `${import.meta.env.BASE_URL}/trust-center`;

export const TrustCenterDataProvider = ({ children }) => {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Categorized file lists derived from manifest
  const [policies, setPolicies] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [reports, setReports] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // Report metadata
  const [reportManifest, setReportManifest] = useState(null);
  const [nextReportDate, setNextReportDate] = useState(null);
  const [assessmentManifest, setAssessmentManifest] = useState(null);

  const getFileUrl = useCallback((filePath) => {
    return `${TC_BASE_PATH}/${filePath}`;
  }, []);

  const loadManifest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheBuster = Date.now();
      const res = await fetch(`${TC_BASE_PATH}/manifest.json?t=${cacheBuster}`);

      if (!res.ok) {
        throw new Error(`Failed to load trust-center manifest (${res.status})`);
      }

      const data = await res.json();
      setManifest(data);

      const rawFiles = data.files || [];

      // Enrich file entries with derived title from path
      const ACRONYMS = ['cli', 'ksi', 'vdr', 'oar', 'scn', 'qar', 'api', 'sso', 'pii', 'mfa'];
      const files = rawFiles.map(f => {
        const filename = f.path.split('/').pop();
        const title = f.title || filename
          .replace(/\.(md|json|pdf|html)$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .replace(/\b\w+\b/g, w => ACRONYMS.includes(w.toLowerCase()) ? w.toUpperCase() : w);
        return { ...f, title, filename };
      });

      // Categorize files
      setPolicies(files.filter(f => f.category === 'policies'));
      setSchemas(files.filter(f => f.category === 'schemas'));
      setReports(files.filter(f => f.category === 'reports' || f.category === 'assessments'));
      setAssessments(files.filter(f => f.category === 'assessments'));

      // Fetch report-generation-manifest if available
      const reportManifestFile = files.find(
        f => f.path.includes('report-generation-manifest.json')
      );
      if (reportManifestFile) {
        try {
          const rmRes = await fetch(getFileUrl(reportManifestFile.path) + `?t=${cacheBuster}`);
          if (rmRes.ok) {
            setReportManifest(await rmRes.json());
          }
        } catch (e) {
          console.warn('Failed to load report-generation-manifest:', e);
        }
      }

      // Fetch next_report_date — try trust-center first, fall back to public/data
      const nextDateFile = files.find(f => f.path.includes('next_report_date.json'));
      const dataBasePath = import.meta.env.BASE_URL.endsWith('/')
        ? `${import.meta.env.BASE_URL}data`
        : `${import.meta.env.BASE_URL}/data`;
      let nextDateLoaded = false;
      if (nextDateFile) {
        try {
          const ndRes = await fetch(getFileUrl(nextDateFile.path) + `?t=${cacheBuster}`);
          if (ndRes.ok) {
            setNextReportDate(await ndRes.json());
            nextDateLoaded = true;
          }
        } catch (e) {
          console.warn('Failed to load next_report_date from trust-center:', e);
        }
      }
      if (!nextDateLoaded) {
        try {
          const ndRes = await fetch(`${dataBasePath}/next_report_date.json?t=${cacheBuster}`);
          if (ndRes.ok) {
            setNextReportDate(await ndRes.json());
          }
        } catch (e) {
          console.warn('Failed to load next_report_date fallback:', e);
        }
      }

      // Fetch assessments manifest if available
      const assessManifestFile = files.find(f => f.path.includes('reports-manifest.json'));
      if (assessManifestFile) {
        try {
          const amRes = await fetch(getFileUrl(assessManifestFile.path) + `?t=${cacheBuster}`);
          if (amRes.ok) {
            setAssessmentManifest(await amRes.json());
          }
        } catch (e) {
          console.warn('Failed to load assessment manifest:', e);
        }
      }

      console.log('✅ Trust Center manifest loaded:', files.length, 'files');
    } catch (err) {
      console.error('❌ Trust Center manifest load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getFileUrl]);

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  return (
    <TrustCenterDataContext.Provider value={{
      manifest,
      loading,
      error,
      policies,
      schemas,
      reports,
      assessments,
      reportManifest,
      nextReportDate,
      assessmentManifest,
      getFileUrl,
      reload: loadManifest
    }}>
      {children}
    </TrustCenterDataContext.Provider>
  );
};

export const useTrustCenterData = () => {
  const context = useContext(TrustCenterDataContext);
  if (context === undefined) {
    throw new Error('useTrustCenterData must be used within a TrustCenterDataProvider');
  }
  return context;
};

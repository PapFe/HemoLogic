import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileJson, Table, Download, Copy, CheckCircle2, AlertCircle, Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')          // split camelCase: patientId -> patient Id
    .replace(/_/g, ' ')                  // snake_case -> snake case
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
};

const ResultsDisplay = ({ data }) => {
  const [viewMode, setViewMode] = useState('table');
  const [showChat, setShowChat] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [fullAnalysisText, setFullAnalysisText] = useState('');
  const chatContainerRef = useRef(null);
  const { toast } = useToast();

  // --- typing effect for AI analysis text ---
  useEffect(() => {
    if (showChat && isStreaming) {
      if (streamedText.length < fullAnalysisText.length) {
        const timeout = setTimeout(() => {
          setStreamedText(fullAnalysisText.slice(0, streamedText.length + 1));
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 25);
        return () => clearTimeout(timeout);
      } else {
        setIsStreaming(false);
      }
    }
  }, [showChat, isStreaming, streamedText, fullAnalysisText]);

  const startAnalysis = async () => {
    if (showChat) return; // avoid double clicks

    try {
      setShowChat(true);
      setStreamedText('');
      setFullAnalysisText('');
      setIsStreaming(false);

      const endpoint = localStorage.getItem('hemologic_agent_endpoint');
      if (!endpoint) {
        throw new Error('No agent endpoint configured.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // later you can send: body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      const text = json.analysis || 'No analysis text received.';
      setFullAnalysisText(text);
      setIsStreaming(true);
    } catch (error) {
      console.error('Analysis API error:', error);
      setIsStreaming(false);
      setStreamedText('Failed to load analysis from server.');

      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: 'JSON data has been copied to your clipboard.',
    });
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // we don’t rely on patientInfo anymore
    a.download = `blood-test.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'JSON file is being downloaded.',
    });
  };

  // --- derive status from value + limits ---
  const computeStatus = (measurement) => {
    const raw = measurement.value;
    const v = raw === '' || raw === null || raw === undefined ? NaN : Number(String(raw).replace(',', '.'));
    const low = measurement.lower_limit;
    const high = measurement.upper_limit;

    if (Number.isNaN(v)) return 'unknown';

    if (low != null && v < low) return 'low';
    if (high != null && v > high) return 'high';
    return 'normal';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'low':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const buildReferenceRange = (m) => {
    const low = m.lower_limit;
    const high = m.upper_limit;

    if (low != null && high != null) return `${low} – ${high}`;
    if (low != null && high == null) return `≥ ${low}`;
    if (low == null && high != null) return `≤ ${high}`;
    return '—';
  };

  const measurements = data.measurements || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-blue-900">Extracted Results</h2>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setViewMode('table')}
            variant={viewMode === 'table' ? 'default' : 'outline'}
            className={
              viewMode === 'table'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
            }
          >
            <Table className="w-4 h-4 mr-2" />
            Table View
          </Button>
          <Button
            onClick={() => setViewMode('json')}
            variant={viewMode === 'json' ? 'default' : 'outline'}
            className={
              viewMode === 'json'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
            }
          >
            <FileJson className="w-4 h-4 mr-2" />
            JSON View
          </Button>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            onClick={downloadJSON}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Patient Information
            </h3>
            {/* currently no patientInfo in the new JSON; keep this box as placeholder */}
            <p className="text-sm text-blue-700 italic">
              A standardizált laborparaméterek kerültek beolvasásra.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Test Results
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Parameter</th>
                    <th className="px-4 py-3 text-left font-semibold">Value</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Reference Range</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m, index) => {
                    const status = computeStatus(m);
                    const refRange = buildReferenceRange(m);

                    return (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className={`border-b border-blue-100 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-blue-900">
                          {m.name}
                        </td>
                        <td className="px-4 py-3 text-blue-800">
                          {m.value === '' || m.value == null ? '—' : m.value}
                        </td>
                        <td className="px-4 py-3 text-blue-700">
                          {m.unit || '—'}
                        </td>
                        <td className="px-4 py-3 text-blue-700">
                          {refRange}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              status
                            )}`}
                          >
                            {getStatusIcon(status)}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center w-full">
            {!showChat && (
              <Button
                onClick={startAnalysis}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 h-auto text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                Vérkép elemzés
              </Button>
            )}

            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-3xl mt-4 overflow-hidden"
                >
                  <div className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner overflow-hidden">
                    <div className="bg-indigo-100 px-4 py-3 flex items-center gap-2 border-b border-indigo-200">
                      <Bot className="w-5 h-5 text-indigo-700" />
                      <span className="font-semibold text-indigo-900">
                        AI Medical Assistant
                      </span>
                      {isStreaming && (
                        <span className="ml-auto text-xs text-indigo-600 animate-pulse">
                          Thinking...
                        </span>
                      )}
                    </div>

                    <div
                      ref={chatContainerRef}
                      className="p-6 h-[300px] overflow-y-auto font-mono text-sm leading-relaxed text-indigo-900 whitespace-pre-wrap"
                    >
                      {streamedText}
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500 italic">
                      Disclaimer: This does not constitute professional medical advice. Content is AI-generated.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="bg-blue-900 rounded-lg p-6 overflow-x-auto">
          <pre className="text-sm text-blue-100 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsDisplay;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import { AnalysisReport } from '../types';
import * as api from '../api';
import SteamBindPrompt from '../components/SteamBindPrompt';

const AnalysisScreen: React.FC = () => {
  const { latestReport, inventoryStats, isLoading, runAnalysis, user } = useAppContext();

  if (!user?.steamId) {
    return (
      <SteamBindPrompt
        onBind={async () => {
          try {
            const url = await api.getSteamLoginUrl();
            window.location.href = url;
          } catch (e: any) {
            alert(e?.message || '获取Steam登录地址失败');
          }
        }}
      />
    );
  }
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (latestReport) {
      setReports((prev) => {
        const exists = prev.some((r) => r.id === latestReport.id);
        if (exists) {
          return prev.map((r) => (r.id === latestReport.id ? latestReport : r));
        }
        return [latestReport, ...prev];
      });
    }
  }, [latestReport]);

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const data = await api.getAnalysisReports();
      setReports(data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }));
    } catch {
      // 静默处理加载失败
    } finally {
      setReportsLoading(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!inventoryStats || inventoryStats.totalValue === 0) {
      Alert.alert('提示', '请先添加库存物品后再生成分析');
      return;
    }
    try {
      setIsGenerating(true);
      await runAnalysis();
    } catch {
      Alert.alert('错误', '生成分析报告失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '未知日期';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const truncateContent = (content: string, maxLength: number = 120): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const renderLatestReport = () => {
    const report = latestReport;
    if (!report) return null;

    return (
      <Card style={styles.latestCard}>
        <Card.Content>
          <View style={styles.latestHeader}>
            <Text style={styles.latestIcon}>📊</Text>
            <View style={styles.latestTitleWrap}>
              <Text style={styles.latestTitle}>{report.title}</Text>
              <Text style={styles.latestDate}>{formatDate(report.createdAt)}</Text>
            </View>
          </View>
          <ScrollView
            style={styles.latestContentScroll}
            nestedScrollEnabled
          >
            <Text style={styles.latestContent}>{report.content}</Text>
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderReportCard = (report: AnalysisReport) => (
    <Card key={report.id} style={styles.reportCard}>
      <Card.Content>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportBadge}>{report.analysisType}</Text>
        </View>
        <Text style={styles.reportDate}>{formatDate(report.createdAt)}</Text>
        <Text style={styles.reportPreview}>{truncateContent(report.content)}</Text>
        {report.totalValue !== undefined && report.totalValue !== null && (
          <Text style={styles.reportValue}>
            库存总价值: ¥{report.totalValue.toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🤖</Text>
      <Text style={styles.emptyTitle}>暂无分析报告</Text>
      <Text style={styles.emptyDescription}>
        点击上方按钮生成您的第一份CS2库存AI分析报告
      </Text>
    </View>
  );

  const renderPreviousReports = () => {
    if (reportsLoading) {
      return (
        <View style={styles.reportsLoading}>
          <ActivityIndicator size="small" color="#1a73e8" />
          <Text style={styles.reportsLoadingText}>加载历史报告...</Text>
        </View>
      );
    }

    if (reports.length === 0) return null;

    return (
      <View>
        <Text style={styles.sectionTitle}>历史报告</Text>
        {reports.map(renderReportCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.generateSection}>
          <Button
            mode="contained"
            onPress={handleGenerateAnalysis}
            disabled={isGenerating || isLoading}
            style={styles.generateButton}
            labelStyle={styles.generateButtonLabel}
            contentStyle={styles.generateButtonContent}
            icon={isGenerating ? undefined : 'brain'}
          >
            {isGenerating ? '正在生成分析...' : '生成AI分析报告'}
          </Button>
          <Text style={styles.generateHint}>
            AI将分析您的库存价值、物品稀有度分布及市场趋势
          </Text>
        </View>

        {isGenerating && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.generatingText}>AI正在分析您的库存数据...</Text>
            <Text style={styles.generatingSubtext}>这可能需要几秒钟</Text>
          </View>
        )}

        {!isGenerating && !latestReport && reports.length === 0 && !reportsLoading && (
          renderEmptyState()
        )}

        {renderLatestReport()}

        {renderPreviousReports()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  generateSection: {
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    elevation: 3,
  },
  generateButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generateButtonContent: {
    height: 50,
  },
  generateHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  generatingContainer: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 15,
  },
  generatingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginTop: 15,
  },
  generatingSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
  },
  latestCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  latestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  latestIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  latestTitleWrap: {
    flex: 1,
  },
  latestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  latestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  latestContentScroll: {
    maxHeight: 300,
  },
  latestContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 5,
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  reportBadge: {
    fontSize: 11,
    color: '#1a73e8',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  reportPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reportValue: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  reportsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  reportsLoadingText: {
    fontSize: 14,
    color: '#999',
  },
});

export default AnalysisScreen;

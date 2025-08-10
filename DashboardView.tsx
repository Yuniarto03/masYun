import React, { useState, useMemo, useContext, useCallback, useRef, forwardRef, useEffect, DragEvent, ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { Panel } from '../Panel';
import { DataContext } from '../../contexts/DataContext';
import { 
    TableRow, FileHeaders, DashboardWidget, WidgetType, KPIWidgetConfig, ChartWidgetConfig, EmbeddedChartWidgetConfig,
    PivotTableSummaryWidgetConfig, KPIFilter, ImageWidgetConfig, StatsWidgetConfig, GaugeWidgetConfig, TableWidgetConfig,
    AggregatorType, IconType, ChartState, PivotReportState, ChartDataItem, PivotTheme, ChartStyle, PivotTableUISettings
} from '../../types';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { exportChartDataToCSV, downloadElementAsHTML } from '../../services/DataProcessingService';
import { PIVOT_THEMES, CHART_STYLES } from '../../constants';

// --- ICONS ---
const EditIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const AddIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ConfigIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.447.368.592.984.26 1.431l-1.296-2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.32 6.32 0 01-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11.94l-.213-1.281c-.063-.374-.313.686-.645.87a6.32 6.32 0 01-.22-.127c-.324-.196-.72-.257-1.075.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.293.24.438.613-.438.995s-.145-.755-.438-.995l-1.003-.827a1.125 1.125 0 01-.26-1.431l1.296 2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.075.124.073-.044.146-.087.22-.127.332-.183.582-.495.645.87l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RemoveIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const DownloadIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const LinkIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const PivotIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3m4-4h14M7 12H3m4 4h14M7 16H3" /></svg>;
const ImageIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const StatsIcon: IconType = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const GaugeIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M4.208 8.058l-1.255.608M21.047 8.666l-1.255-.608M4.5 13.5H3m18 0h-1.5m-15.392 4.442l-1.255-.608M21.047 17.334l-1.255.608M12 21v-1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12l3.75-2.165" /></svg>;
const ChartIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const CalculatorIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm3-6h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zM6 6h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3z" /></svg>;
const CloseIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;
const TableIcon: IconType = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const NUMERIC_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'sum', label: 'Sum' }, { value: 'average', label: 'Average' }, { value: 'min', label: 'Min' }, { value: 'max', 'label': 'Max' }, ];
const ALL_FIELD_AGGREGATORS: { value: AggregatorType, label: string }[] = [ { value: 'count', label: 'Count All' }, { value: 'countNonEmpty', label: 'Count Non-Empty' }, ];
const DASHBOARD_CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f97316', '#eab308', '#22d3ee'];

// Aggregation logic for charts from VisualizationView
const performAggregation = (values: any[], aggType: AggregatorType): number | undefined => {
    if (!values || values.length === 0) return undefined;
    if (aggType === 'count') return values.length;
    
    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (aggType === 'countNonEmpty') return nonEmptyValues.length;
    
    const numericValues = nonEmptyValues.map(v => parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v) && isFinite(v));
    if (numericValues.length === 0) return undefined;
    
    switch (aggType) {
        case 'sum': return numericValues.reduce((s, a) => s + a, 0);
        case 'average': return numericValues.reduce((s, a) => s + a, 0) / numericValues.length;
        case 'min': return Math.min(...numericValues);
        case 'max': return Math.max(...numericValues);
        default: return undefined;
    }
};

// Helper functions for PivotTableSummaryWidget
const isNumeric = (value: any): boolean => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return false;
    const numericString = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const num = parseFloat(numericString);
    return !isNaN(num) && isFinite(num);
};

const formatCellValue = (value: any, settings: PivotTableUISettings): string => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return settings.emptyCellText;
    }
    let numToFormat: number | null = null;
    if (typeof value === 'number') {
        numToFormat = value;
    } else if (typeof value === 'string') {
        const cleanedValue = value.replace(/,/g, ''); 
        if (isNumeric(cleanedValue)) { 
            numToFormat = parseFloat(cleanedValue);
        }
    }

    if (numToFormat !== null) {
        return numToFormat.toLocaleString(undefined, {
            minimumFractionDigits: settings.decimalPlaces,
            maximumFractionDigits: settings.decimalPlaces,
            useGrouping: settings.useThousandsSeparator,
        });
    }
    return String(value);
};


// --- WIDGET COMPONENTS ---

const KPIWidget: React.FC<{ config: KPIWidgetConfig, onConfigure: (id: string) => void, activeFilters: KPIFilter[] }> = ({ config, onConfigure, activeFilters }) => {
    const { tableData } = useContext(DataContext);

    const { value, label } = useMemo(() => {
        if (!config.valueField || tableData.length === 0) {
            return { value: 'N/A', label: config.title };
        }
        
        let dataToProcess = tableData;
        
        // Apply global dashboard filters
        if (activeFilters && activeFilters.length > 0) {
            activeFilters.forEach(filter => {
                dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
            });
        }

        // Apply widget-specific filters
        if (config.filters && config.filters.length > 0) {
            config.filters.forEach(filter => {
                if (filter.field && filter.value) {
                    dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
                }
            });
        }

        const values = dataToProcess.map(row => row[config.valueField!]);
        
        let result: number | undefined;

        if (config.aggregator === 'count' || config.aggregator === 'countNonEmpty') {
             const nonEmptyValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
             result = config.aggregator === 'count' ? values.length : nonEmptyValues.length;
        } else {
             const numericValues = values.map(v => v === null || v === undefined ? NaN : parseFloat(String(v))).filter(v => !isNaN(v));
             if (numericValues.length === 0) return { value: 'N/A', label: config.title };

             switch (config.aggregator) {
                case 'sum': result = numericValues.reduce((s, a) => s + a, 0); break;
                case 'average': result = numericValues.reduce((s, a) => s + a, 0) / numericValues.length; break;
                case 'min': result = Math.min(...numericValues); break;
                case 'max': result = Math.max(...numericValues); break;
                default: result = 0;
            }
        }
        
        const formattedValue = result.toLocaleString(undefined, { maximumFractionDigits: 2 });
        
        let finalLabel = config.title;
        if (config.filters && config.filters.length > 0) {
            const filterDescriptions = config.filters
                .filter(f => f.field && f.value)
                .map(f => `${f.field} = ${f.value}`)
                .join(' & ');
            if (filterDescriptions) {
                finalLabel += ` (${filterDescriptions})`;
            }
        }

        return { value: formattedValue, label: finalLabel };

    }, [config, tableData, activeFilters]);

    if (!config.valueField) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><ConfigIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure KPI</p></div>;
    }

    return (
        <div className="text-center">
            <div className="kpi-value" style={{ color: config.color || DASHBOARD_CHART_COLORS[0] }}>{value}</div>
            <div className="kpi-label" title={label}>{label}</div>
        </div>
    );
};

const ChartWidget: React.FC<{ config: ChartWidgetConfig, onConfigure: (id: string) => void, activeFilters: KPIFilter[], onAddFilter: (field: string, value: string) => void }> = ({ config, onConfigure, activeFilters, onAddFilter }) => {
    const { tableData } = useContext(DataContext);

    const chartData = useMemo(() => {
        if (!config.xAxisField || !config.yAxisFields || config.yAxisFields.length === 0 || tableData.length === 0) return [];
        
        let dataToProcess = tableData;

        // Apply global dashboard filters
        if (activeFilters && activeFilters.length > 0) {
            activeFilters.forEach(filter => {
                dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
            });
        }

        if (config.filters && config.filters.length > 0) {
            config.filters.forEach(filter => {
                if (filter.field && filter.value) {
                    dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
                }
            });
        }

        const aggregated: { [key: string]: { [yField: string]: number[] } } = {};
        dataToProcess.forEach(row => {
            const xValue = String(row[config.xAxisField!]);
            if (!aggregated[xValue]) aggregated[xValue] = {};
            
            config.yAxisFields.forEach(yField => {
                const yValue = parseFloat(String(row[yField]));
                if (!isNaN(yValue)) {
                    if (!aggregated[xValue][yField]) aggregated[xValue][yField] = [];
                    aggregated[xValue][yField].push(yValue);
                }
            });
        });
        
        return Object.entries(aggregated).map(([name, yFieldValues]) => {
            const dataPoint: { name: string, [key: string]: number | string } = { name };
            config.yAxisFields.forEach(yField => {
                const values = yFieldValues[yField] || [];
                let yValue: number;
                switch (config.aggregator) {
                    case 'sum': yValue = values.reduce((s, a) => s + a, 0); break;
                    case 'average': yValue = values.length > 0 ? values.reduce((s, a) => s + a, 0) / values.length : 0; break;
                    case 'count': yValue = values.length; break;
                    case 'min': yValue = values.length > 0 ? Math.min(...values) : 0; break;
                    case 'max': yValue = values.length > 0 ? Math.max(...values) : 0; break;
                    default: yValue = 0;
                }
                dataPoint[yField] = yValue;
            });
            return dataPoint;
        });

    }, [config, tableData, activeFilters]);
    
    if (!config.xAxisField || !config.yAxisFields || config.yAxisFields.length === 0) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><ConfigIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure Chart</p></div>;
    }
    
    const handleChartClick = (data: any) => {
        if (!config.xAxisField) return;
        const payload = data.activePayload?.[0]?.payload;
        if(payload && payload.name) {
            onAddFilter(config.xAxisField, payload.name);
        }
    };
    
    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return <BarChart data={chartData} onClick={handleChartClick}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" /><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend />
                    {config.yAxisFields.map((field, index) => (
                        <Bar key={field} dataKey={field} fill={DASHBOARD_CHART_COLORS[(index + 1) % DASHBOARD_CHART_COLORS.length]} cursor="pointer"/>
                    ))}
                </BarChart>;
            case 'line':
                return <LineChart data={chartData} onClick={handleChartClick}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" /><YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" /><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend />
                    {config.yAxisFields.map((field, index) => (
                        <Line key={field} type="monotone" dataKey={field} stroke={DASHBOARD_CHART_COLORS[(index + 2) % DASHBOARD_CHART_COLORS.length]} cursor="pointer" />
                    ))}
                </LineChart>;
            case 'pie':
                const pieField = config.yAxisFields[0];
                return <PieChart><Pie data={chartData} dataKey={pieField} nameKey="name" cx="50%" cy="50%" outerRadius={80} label cursor="pointer" onClick={(payload) => onAddFilter(config.xAxisField!, payload.name)}>{chartData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length]} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} /><Legend /></PieChart>;
            default: return null;
        }
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    );
};

const EmbeddedChartWidget: React.FC<{ config: EmbeddedChartWidgetConfig, onConfigure: (id: string) => void, activeFilters: KPIFilter[], onAddFilter: (field: string, value: string) => void }> = ({ config, onConfigure, activeFilters, onAddFilter }) => {
    const { visualizationState, pivotReports, tableData } = useContext(DataContext);
    
    const chartToRender = useMemo(() => {
        if (!config.sourceView || !config.sourceId) return null;

        let dataToProcess = tableData;
        if (activeFilters.length > 0) {
            activeFilters.forEach(filter => {
                dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
            });
        }

        if (config.sourceView === 'visualizations') {
            const chartState = visualizationState[config.sourceId as 'chart1' | 'chart2'];
            if (!chartState || !chartState.xAxisField || chartState.yAxisFields.length === 0 || !dataToProcess || dataToProcess.length === 0) return null;

            const staging: { [category: string]: { [field: string]: any[] } } = {};
            dataToProcess.forEach(row => {
                const categoryValue = row[chartState.xAxisField!];
                if (categoryValue === null || categoryValue === undefined) return;
                const category = String(categoryValue);

                if (!staging[category]) staging[category] = {};
                chartState.yAxisFields.forEach(yField => {
                    if (!staging[category][yField.field]) staging[category][yField.field] = [];
                    staging[category][yField.field].push(row[yField.field]);
                });
            });

            const finalData = Object.entries(staging).map(([name, fields]) => {
                const item: ChartDataItem = { name };
                chartState.yAxisFields.forEach(yField => {
                    const result = performAggregation(fields[yField.field], yField.aggregator);
                    item[yField.displayName || yField.field] = result;
                });
                return item;
            });
            
            return { 
                type: chartState.chartType, 
                name: `Chart: ${config.sourceId}`, 
                data: finalData, 
                xAxisField: chartState.xAxisField,
                yFields: chartState.yAxisFields, 
                style: CHART_STYLES[chartState.chartOptions.chartStyleId] || CHART_STYLES.vibrantHolo 
            };
        }
        
        if (config.sourceView === 'pivotTable') {
            const report = pivotReports.find(r => r.id === config.sourceId);
            if (!report?.pivotResult?.chartData || report.pivotResult.chartData.length === 0) {
                return null;
            }
             // NOTE: Embedded Pivot charts do not currently support global dashboard filtering
            const chartData = report.pivotResult.chartData;
            const dataKeys = Object.keys(chartData[0] || {}).filter(k => k !== 'name');
            
            const pivotYFields = dataKeys.map((key, index) => {
                 const matchingVf = report.pivotResult.config.valueFields.find(vf => key.includes(vf.displayName || vf.field));
                 const theme = PIVOT_THEMES[report.uiSettings.theme] || PIVOT_THEMES.vibrantHologram;
                 return {
                     field: key,
                     displayName: key,
                     color: matchingVf?.color || theme.chartColors[index % theme.chartColors.length]
                 };
            });

            return { 
                type: report.uiSettings.chartType, 
                name: `Pivot: ${report.name}`, 
                data: chartData, 
                xAxisField: report.pivotResult.config.rowFields[0],
                yFields: pivotYFields,
                style: PIVOT_THEMES[report.uiSettings.theme] || PIVOT_THEMES.vibrantHologram
            };
        }
        return null;
    }, [config, visualizationState, pivotReports, tableData, activeFilters]);
    
    if (!chartToRender || !chartToRender.data || chartToRender.data.length === 0) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><LinkIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Link to a Chart</p></div>;
    }
    
    const handleChartClick = (data: any) => {
        if (!chartToRender.xAxisField) return;
        const payload = data.activePayload?.[0]?.payload;
        if (payload && payload.name) {
            onAddFilter(chartToRender.xAxisField, payload.name);
        }
    };
    
    const renderChart = () => {
        const { data, type, yFields, style } = chartToRender;
        const colors = (style && 'chartColors' in style) ? style.chartColors : (style && 'colors' in style) ? style.colors : ['#8884d8'];
        const dataKeys = yFields.map(yf => yf.displayName || yf.field);

        switch(type) {
            case 'bar': case 'horizontalBar':
                 return <BarChart data={data} layout={type === 'horizontalBar' ? 'vertical' : 'horizontal'} onClick={handleChartClick}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />{type === 'horizontalBar' ? <XAxis type="number" tick={{fontSize: 10}}/> : <XAxis dataKey="name" tick={{ fontSize: 10 }} />}{type === 'horizontalBar' ? <YAxis type="category" dataKey="name" tick={{fontSize: 10}} width={80} /> : <YAxis tick={{ fontSize: 10 }} />}{dataKeys.map((key, i) => <Bar key={key} dataKey={key} name={key} fill={yFields[i]?.color || colors[i % colors.length]} cursor="pointer" />)}<Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></BarChart>;
            case 'line': return <LineChart data={data} onClick={handleChartClick}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />{dataKeys.map((key, i) => <Line key={key} type="monotone" name={key} dataKey={key} stroke={yFields[i]?.color || colors[i % colors.length]} cursor="pointer" />)}<Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></LineChart>;
            case 'area': return <AreaChart data={data} onClick={handleChartClick}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />{dataKeys.map((key, i) => <Area key={key} type="monotone" name={key} dataKey={key} stroke={yFields[i]?.color || colors[i % colors.length]} fill={yFields[i]?.color || colors[i % colors.length]} fillOpacity={0.6} cursor="pointer"/>)}<Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></AreaChart>;
            case 'pie': case 'donut': {
                if (dataKeys.length === 0) return <p>No data for Pie chart</p>;
                const pieStyle = 'pie' in style ? style.pie : undefined;
                return <PieChart><Pie data={data} dataKey={dataKeys[0]} nameKey="name" cx="50%" cy="50%" outerRadius={pieStyle && isFinite(Number(pieStyle.outerRadius)) ? Number(pieStyle.outerRadius) : 80} innerRadius={type === 'donut' ? (pieStyle && isFinite(Number(pieStyle.innerRadius)) ? Number(pieStyle.innerRadius) : 40) : 0} label cursor="pointer" onClick={(payload) => onAddFilter(chartToRender.xAxisField!, payload.name)}>{data.map((entry, index) => (<Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke={pieStyle?.stroke} className={pieStyle?.className} />))}</Pie><Tooltip contentStyle={{backgroundColor: '#1f2937'}} /><Legend /></PieChart>;
            }
            default: return <p>Unsupported Chart Type: {type}</p>
        }
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    );
};

const PivotTableSummaryWidget: React.FC<{ config: PivotTableSummaryWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { pivotReports } = useContext(DataContext);

    const { report, result, uiSettings, themeClasses } = useMemo(() => {
        if (!config.sourceId) return {};
        const report = pivotReports.find(r => r.id === config.sourceId);
        if (!report?.pivotResult) return { report };
        const result = report.pivotResult;
        const uiSettings = report.uiSettings;
        const themeClasses = PIVOT_THEMES[uiSettings.theme] || PIVOT_THEMES.vibrantHologram;
        return { report, result, uiSettings, themeClasses };
    }, [config.sourceId, pivotReports]);
    
    if (!config.sourceId || !report || !result) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><PivotIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Link to a Pivot Table</p></div>;
    }

    const MAX_ROWS = 10;
    const MAX_COLS_GROUPS = 5;

    const rowKeys = result.uniqueFlatRowKeys.slice(0, MAX_ROWS);
    const colKeys = result.uniqueFlatColKeys.slice(0, MAX_COLS_GROUPS);
    const matrix = result.dataMatrix.slice(0, MAX_ROWS).map(row => row.slice(0, MAX_COLS_GROUPS));
    const valueFields = result.config.valueFields;

    return (
        <div className="overflow-auto w-full h-full text-xs p-1">
            <table className="min-w-full">
                <thead className="sticky top-0 z-10">
                    <tr>
                        <th className={`p-1 text-left ${themeClasses.tableClasses.headerRowDesc}`}>
                            {result.config.rowFields.join(' / ')}
                        </th>
                        {colKeys.map((cPath, cIndex) => (
                            <th key={cIndex} colSpan={valueFields.length} className={`p-1 text-center ${themeClasses.tableClasses.headerDefault}`}>
                                {cPath.join(' / ')}
                            </th>
                        ))}
                    </tr>
                    {valueFields.length > 1 && colKeys.length > 0 && (
                        <tr>
                            <th className={`p-1 ${themeClasses.tableClasses.headerRowDesc}`}></th>
                            {colKeys.flatMap((cPath, cIndex) => 
                                valueFields.map((vf, vfIndex) => (
                                    <th key={`${cIndex}-${vfIndex}`} className={`p-1 text-center ${themeClasses.tableClasses.headerDefault}`}>
                                        {vf.displayName || vf.field}
                                    </th>
                                ))
                            )}
                        </tr>
                    )}
                </thead>
                <tbody>
                    {rowKeys.map((rPath, rIndex) => (
                        <tr key={rIndex}>
                            <td className={`p-1 text-left font-medium ${themeClasses.tableClasses.cellRowHeader}`}>
                                {rPath.join(' / ')}
                            </td>
                            {colKeys.flatMap((cPath, cIndex) => {
                                const cellData = matrix[rIndex]?.[cIndex] || [];
                                return valueFields.map((vf, vfIndex) => (
                                    <td key={`${vfIndex}`} className={`p-1 text-right ${themeClasses.tableClasses.cellDefault}`}>
                                        {formatCellValue(cellData[vfIndex], uiSettings!)}
                                    </td>
                                ))
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const ImageWidget: React.FC<{ config: ImageWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    if (!config.src) {
        return (
            <div className="widget-placeholder" onClick={() => onConfigure(config.id)}>
                <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p>Configure Image</p>
            </div>
        );
    }
    return <img src={config.src} alt={config.title} className="w-full h-full" style={{ objectFit: config.fit }} />;
};

const StatsWidget: React.FC<{ config: StatsWidgetConfig, onConfigure: (id: string) => void, activeFilters: KPIFilter[] }> = ({ config, onConfigure, activeFilters }) => {
    const { tableData } = useContext(DataContext);

    const stats = useMemo(() => {
        if (config.variables.length === 0 || !tableData || tableData.length === 0) return [];
        
        let dataToProcess = tableData;
        if (activeFilters && activeFilters.length > 0) {
            activeFilters.forEach(filter => {
                dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
            });
        }
        
        const totalRows = dataToProcess.length;
        if(totalRows === 0) return [];

        return config.variables.map(variable => {
            const allValues = dataToProcess.map(row => row[variable]);
            const validValues = allValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
            const missing = totalRows - validValues.length;
            const missingPercentage = (missing / totalRows) * 100;

            const numericValues = validValues.map(v => parseFloat(String(v).replace(/,/g, ''))).filter(v => !isNaN(v) && isFinite(v));

            if (numericValues.length / validValues.length > 0.8) {
                const sum = numericValues.reduce((s, a) => s + a, 0);
                const mean = numericValues.length > 0 ? sum / numericValues.length : 0;
                const stdDev = numericValues.length > 0 ? Math.sqrt(numericValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericValues.length) : 0;
                const sorted = [...numericValues].sort((a, b) => a - b);
                const min = sorted[0] ?? 0;
                const max = sorted[sorted.length - 1] ?? 0;

                const numBins = 10;
                const binWidth = (max - min) / numBins;
                let histogram = [];
                if (binWidth > 0) {
                    const bins = Array(numBins).fill(0).map((_, i) => ({ name: `${(min + i * binWidth).toFixed(1)}`, count: 0 }));
                    numericValues.forEach(val => {
                        let binIndex = Math.floor((val - min) / binWidth);
                        if (binIndex >= numBins) binIndex = numBins - 1;
                        if (bins[binIndex]) bins[binIndex].count++;
                    });
                    histogram = bins;
                } else if (numericValues.length > 0) {
                    histogram = [{ name: min.toFixed(1), count: numericValues.length }];
                }

                return {
                    name: variable,
                    type: 'numeric',
                    stats: {
                        'Mean': mean.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        'Std Dev': stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        'Median': (sorted[Math.floor(sorted.length * 0.5)] ?? 0).toLocaleString(),
                        'Min': min.toLocaleString(),
                        'Max': max.toLocaleString(),
                        'Missing': `${missing} (${missingPercentage.toFixed(1)}%)`
                    },
                    chartData: histogram
                };
            } else {
                const valueCounts = new Map<any, number>();
                validValues.forEach(v => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
                
                const frequencies = Array.from(valueCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([value, count]) => ({ name: String(value).slice(0, 15) + (String(value).length > 15 ? '...' : ''), count }));

                return {
                    name: variable,
                    type: 'categorical',
                    stats: {
                        'Distinct Values': valueCounts.size.toLocaleString(),
                        'Missing': `${missing} (${missingPercentage.toFixed(1)}%)`,
                    },
                    chartData: frequencies
                };
            }
        });
    }, [config.variables, tableData, activeFilters]);

    if (config.variables.length === 0) {
        return (
            <div className="widget-placeholder" onClick={() => onConfigure(config.id)}>
                <StatsIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p>Configure Statistical Analysis</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto text-xs p-1 space-y-3">
            {stats.map(s => (
                <div key={s.name} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                    <h4 className="font-bold text-teal-300 text-sm truncate mb-2">{s.name}</h4>
                    
                    <div className="h-24 w-full mb-2">
                        <ResponsiveContainer>
                            <BarChart data={s.chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#9ca3af' }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 8, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                <Bar dataKey="count" fill={s.type === 'numeric' ? '#22d3ee' : '#a78bfa'} radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {Object.entries(s.stats).map(([label, value]) => (
                            <div key={label} className="flex justify-between items-baseline border-b border-gray-700/50 py-0.5">
                                <span className="text-gray-400 truncate" title={label}>{label}:</span>
                                <span className="font-semibold text-gray-200 truncate" title={String(value)}>{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const GaugeWidget: React.FC<{ config: GaugeWidgetConfig, onConfigure: (id: string) => void, activeFilters: KPIFilter[] }> = ({ config, onConfigure, activeFilters }) => {
    const { tableData } = useContext(DataContext);

    const value = useMemo(() => {
        if (!config.valueField || !tableData || tableData.length === 0) return 0;

        let dataToProcess = tableData;
        if (activeFilters && activeFilters.length > 0) {
            activeFilters.forEach(filter => {
                dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
            });
        }
        
        if (config.filters && config.filters.length > 0) {
            config.filters.forEach(filter => {
                if (filter.field && filter.value) {
                    dataToProcess = dataToProcess.filter(row => String(row[filter.field]) === filter.value);
                }
            });
        }
        
        const values = dataToProcess.map(row => row[config.valueField!]);
        const result = performAggregation(values, config.aggregator);
        return result ?? 0;
    }, [config, tableData, activeFilters]);

    const { minValue, maxValue } = config;

    const needleAngle = useMemo(() => {
        if (maxValue <= minValue) return 0;
        const total = maxValue - minValue;
        const clampedValue = Math.max(minValue, Math.min(value, maxValue));
        const percentage = (clampedValue - minValue) / total;
        return percentage * 180;
    }, [value, minValue, maxValue]);

    if (!config.valueField) {
        return <div className="widget-placeholder" onClick={() => onConfigure(config.id)}><GaugeIcon className="w-12 h-12 text-gray-500 mb-2" /><p>Configure Gauge</p></div>;
    }
    
    const baseColor = config.color || '#10b981';
    const segments = config.segments || [
        { from: minValue, to: minValue + (maxValue - minValue) * 0.5, color: baseColor },
        { from: minValue + (maxValue - minValue) * 0.5, to: minValue + (maxValue - minValue) * 0.8, color: '#f59e0b' }, // yellow
        { from: minValue + (maxValue - minValue) * 0.8, to: maxValue, color: '#ef4444' }, // red
    ];

    const pieData = segments.map(seg => ({ name: seg.label, value: seg.to - seg.from }));
    const colors = segments.map(seg => seg.color);
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-end relative">
            <div className="w-full h-full absolute top-0 left-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="60%"
                            outerRadius="100%"
                            paddingAngle={2}
                            dataKey="value"
                            isAnimationActive={false}
                        >
                            {pieData.map((_entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div 
                className="absolute bottom-1/2 left-1/2 w-1 h-1/2 max-h-[40%] origin-bottom transition-transform duration-500"
                style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }}
            >
                <div className="w-full h-full rounded-t-full" style={{ backgroundColor: config.color || 'white' }}></div>
            </div>
            <div className="absolute bottom-1/2 left-1/2 w-4 h-4 bg-white rounded-full transform -translate-x-1/2 translate-y-1/2 border-2 border-gray-800"></div>
            
            <div className="absolute text-center" style={{bottom: '25%'}}>
                <div className="text-3xl font-extrabold" style={{ color: config.color || 'white', textShadow: `0 0 10px ${config.color || 'rgba(255,255,255,0.5)'}` }}>
                    {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <div className="text-sm text-gray-400 mt-1">{config.valueField} ({config.aggregator})</div>
            </div>
             <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400 px-[10%]">
                <span>{minValue.toLocaleString()}</span>
                <span>{maxValue.toLocaleString()}</span>
            </div>
        </div>
    );
};

const TableWidget: React.FC<{ config: TableWidgetConfig, onConfigure: (id: string) => void }> = ({ config, onConfigure }) => {
    const { tableData } = useContext(DataContext);

    const visibleHeaders = config.columns;
    const dataToShow = tableData.slice(0, config.rowCount);

    if (visibleHeaders.length === 0) {
        return (
            <div className="widget-placeholder" onClick={() => onConfigure(config.id)}>
                <TableIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p>Configure Table</p>
            </div>
        );
    }

    return (
        <div className="overflow-auto w-full h-full text-xs">
            <table className="min-w-full">
                <thead className="sticky top-0 z-10 bg-gray-900/50">
                    <tr>
                        {visibleHeaders.map(header => (
                            <th key={header} className="p-1.5 text-left font-semibold text-teal-300 truncate">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {dataToShow.map((row, index) => (
                        <tr key={index} className="hover:bg-teal-500/10">
                            {visibleHeaders.map(header => (
                                <td key={header} className="p-1.5 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300" title={String(row[header])}>
                                    {String(row[header])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- MODAL COMPONENTS ---

const AddWidgetModal: React.FC<{ isOpen: boolean, onClose: () => void, onAddWidget: (type: WidgetType) => void }> = ({ isOpen, onClose, onAddWidget }) => {
    if (!isOpen) return null;
    const widgetOptions: { type: WidgetType, name: string, description: string, icon: IconType }[] = [
        { type: 'kpi', name: 'KPI Card', description: 'Display a single key metric.', icon: ConfigIcon },
        { type: 'bar', name: 'Bar Chart', description: 'Compare values across categories.', icon: ChartIcon },
        { type: 'line', name: 'Line Chart', description: 'Show trends over a variable.', icon: ChartIcon },
        { type: 'pie', name: 'Pie Chart', description: 'Show proportional data.', icon: ChartIcon },
        { type: 'table', name: 'Data Table', description: 'Show a snippet of raw data.', icon: TableIcon },
        { type: 'gauge', name: 'Gauge Chart', description: 'Display a KPI on a speedometer.', icon: GaugeIcon },
        { type: 'embeddedChart', name: 'Embedded Chart', description: 'Display a chart from another view.', icon: LinkIcon },
        { type: 'pivotTableSummary', name: 'Pivot Table Summary', description: 'Display a pivot table summary.', icon: PivotIcon },
        { type: 'image', name: 'Image', description: 'Display an image from a file.', icon: ImageIcon },
        { type: 'stats', name: 'Statistical Analysis', description: 'Show key stats for selected variables.', icon: StatsIcon },
    ];

    return (
        <div className="dashboard-modal-overlay" onClick={onClose}>
            <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Add a New Widget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {widgetOptions.map(opt => (
                        <button key={opt.type} onClick={() => { onAddWidget(opt.type); onClose(); }} className="p-4 bg-gray-700/50 rounded-lg text-left hover:bg-gray-600/50 transition-colors border border-gray-600 flex items-center gap-4">
                            <opt.icon className="w-8 h-8 text-blue-300 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-blue-300">{opt.name}</h4>
                                <p className="text-sm text-gray-400">{opt.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ConfigureWidgetModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    widget: DashboardWidget,
    onSave: (config: DashboardWidget) => void,
    headers: FileHeaders
}> = ({ isOpen, onClose, widget, onSave, headers }) => {
    const { tableData, pivotReports, visualizationState } = useContext(DataContext);
    const [localConfig, setLocalConfig] = useState(widget);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uniqueValuesCache = useRef<Record<string, string[]>>({});

    const getUniqueValues = (field: string) => {
        if (uniqueValuesCache.current[field]) {
            return uniqueValuesCache.current[field];
        }
        if (!tableData || !field) return [];
        const values = Array.from(new Set(tableData.map(row => row[field])))
            .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
            .map(String)
            .sort();
        uniqueValuesCache.current[field] = values;
        return values;
    };
    
    useEffect(() => {
        setLocalConfig(widget);
    }, [widget]);
    
    const numericalHeaders = useMemo(() => {
        if (!headers || !tableData || tableData.length === 0) return [];
        // A field is considered numerical if a good portion of its non-empty values are numbers.
        return headers.filter(h => {
            const values = tableData.map(row => row[h]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
            if (values.length === 0) return false;
            const numericCount = values.filter(v => !isNaN(parseFloat(String(v)))).length;
            return (numericCount / values.length) > 0.8; // At least 80% numeric
        });
    }, [headers, tableData]);

    if (!isOpen) return null;

    const renderConfigOptions = () => {
        switch (localConfig.type) {
            case 'kpi':
            case 'gauge': {
                const currentConfig = localConfig as KPIWidgetConfig | GaugeWidgetConfig;
                const isValueFieldSelected = !!currentConfig.valueField;
                const isNumericField = numericalHeaders.includes(currentConfig.valueField || '');
                const aggregationOptions = isNumericField || !isValueFieldSelected ? [...NUMERIC_AGGREGATORS, ...ALL_FIELD_AGGREGATORS] : ALL_FIELD_AGGREGATORS;
                
                const handleFieldChange = (e: ChangeEvent<HTMLSelectElement>) => {
                    const newField = e.target.value;
                    const isNewFieldNumeric = numericalHeaders.includes(newField);
                    const currentAggregator = currentConfig.aggregator;
                    const isCurrentAggregatorNumericOnly = ['sum', 'average', 'min', 'max'].includes(currentAggregator);
                    
                    let newAggregator = currentAggregator;
                    if (!isNewFieldNumeric && isCurrentAggregatorNumericOnly) {
                        newAggregator = 'count'; // Reset to a safe default
                    }
                    
                    setLocalConfig({ ...localConfig, valueField: newField, aggregator: newAggregator });
                };

                return (
                    <>
                        <div>
                            <label className="text-sm text-gray-400">Metric (Field)</label>
                            <select value={currentConfig.valueField || ''} onChange={handleFieldChange} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="">Select Field</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Aggregation</label>
                            <select value={currentConfig.aggregator} onChange={e => setLocalConfig({...localConfig, aggregator: e.target.value as AggregatorType})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                {aggregationOptions.map(agg => <option key={agg.value} value={agg.value}>{agg.label}</option>)}
                            </select>
                        </div>
                        {localConfig.type === 'gauge' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Minimum Value</label>
                                    <input type="number" value={(localConfig as GaugeWidgetConfig).minValue} onChange={e => setLocalConfig({...localConfig, minValue: Number(e.target.value)})} className="w-full p-2 bg-gray-700 rounded mt-1"/>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Maximum Value</label>
                                    <input type="number" value={(localConfig as GaugeWidgetConfig).maxValue} onChange={e => setLocalConfig({...localConfig, maxValue: Number(e.target.value)})} className="w-full p-2 bg-gray-700 rounded mt-1"/>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-600">
                           <label className="text-sm font-medium text-gray-300 mb-2 block">Filters</label>
                           <div className="space-y-2 max-h-40 overflow-y-auto">
                               {(currentConfig.filters || []).map((filter, index) => (
                                   <div key={filter.id} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                                       <select 
                                           value={filter.field} 
                                           onChange={e => {
                                               const newFilters = [...(currentConfig.filters || [])];
                                               newFilters[index] = { ...newFilters[index], field: e.target.value, value: '' };
                                               setLocalConfig({ ...localConfig, filters: newFilters });
                                           }} 
                                           className="w-full p-1.5 bg-gray-700 rounded text-xs"
                                       >
                                           <option value="">Select Field</option>
                                           {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                       </select>
                                       <select 
                                           value={filter.value} 
                                           onChange={e => {
                                               const newFilters = [...(currentConfig.filters || [])];
                                               newFilters[index] = { ...newFilters[index], value: e.target.value };
                                               setLocalConfig({ ...localConfig, filters: newFilters });
                                           }}
                                           className="w-full p-1.5 bg-gray-700 rounded text-xs"
                                           disabled={!filter.field}
                                       >
                                           <option value="">Select Value</option>
                                           {getUniqueValues(filter.field).map(v => <option key={v} value={v}>{v}</option>)}
                                       </select>
                                       <button 
                                           onClick={() => {
                                               const newFilters = (currentConfig.filters || []).filter(f => f.id !== filter.id);
                                               setLocalConfig({ ...localConfig, filters: newFilters });
                                           }}
                                           className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                                           title="Remove filter"
                                       >
                                           <RemoveIcon className="w-4 h-4" />
                                       </button>
                                   </div>
                               ))}
                           </div>
                           <button 
                               onClick={() => {
                                   const newFilter: KPIFilter = { id: Date.now().toString(), field: '', value: '' };
                                   const newFilters = [...(currentConfig.filters || []), newFilter];
                                   setLocalConfig({ ...localConfig, filters: newFilters });
                               }}
                               className="mt-2 w-full text-sm text-blue-300 hover:bg-blue-500/10 p-2 rounded-md transition-colors"
                           >
                               + Add Filter
                           </button>
                       </div>
                    </>
                );
            }
            case 'bar': 
            case 'line': 
            case 'pie': {
                const chartConfig = localConfig as ChartWidgetConfig;
                const handleYAxisToggle = (header: string) => {
                    const currentFields = chartConfig.yAxisFields;
                    const newFields = currentFields.includes(header)
                        ? currentFields.filter(f => f !== header)
                        : [...currentFields, header];
                    setLocalConfig({ ...localConfig, yAxisFields: newFields });
                };

                return (
                    <>
                        <div>
                            <label className="text-sm text-gray-400">Category (X-Axis)</label>
                            <select value={chartConfig.xAxisField || ''} onChange={e => setLocalConfig({...localConfig, xAxisField: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="">Select Field</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Values (Y-Axis)</label>
                            {chartConfig.type === 'pie' ? (
                                <select 
                                    value={chartConfig.yAxisFields?.[0] || ''} 
                                    onChange={e => setLocalConfig({...localConfig, yAxisFields: [e.target.value]})} 
                                    className="w-full p-2 bg-gray-700 rounded mt-1"
                                >
                                    <option value="">Select Field</option>
                                    {numericalHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            ) : (
                                <div className="mt-1 p-2 bg-gray-900/50 rounded-md max-h-40 overflow-y-auto space-y-1">
                                    {numericalHeaders.map(h => (
                                        <label key={h} className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={chartConfig.yAxisFields.includes(h)} onChange={() => handleYAxisToggle(h)} className="h-4 w-4 text-teal-400 bg-gray-600 rounded border-gray-500 focus:ring-teal-300"/>
                                            <span>{h}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Aggregation</label>
                            <select value={chartConfig.aggregator} onChange={e => setLocalConfig({...localConfig, aggregator: e.target.value as AggregatorType})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                {[...NUMERIC_AGGREGATORS, ...ALL_FIELD_AGGREGATORS].map(agg => <option key={agg.value} value={agg.value}>{agg.label}</option>)}
                            </select>
                        </div>
                         <div className="mt-4 pt-4 border-t border-gray-600">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Filters</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(chartConfig.filters || []).map((filter, index) => (
                                    <div key={filter.id} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                                        <select 
                                            value={filter.field} 
                                            onChange={e => {
                                                const newFilters = [...(chartConfig.filters || [])];
                                                newFilters[index] = { ...newFilters[index], field: e.target.value, value: '' };
                                                setLocalConfig({ ...localConfig, filters: newFilters });
                                            }} 
                                            className="w-full p-1.5 bg-gray-700 rounded text-xs"
                                        >
                                            <option value="">Select Field</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select 
                                            value={filter.value} 
                                            onChange={e => {
                                                const newFilters = [...(chartConfig.filters || [])];
                                                newFilters[index] = { ...newFilters[index], value: e.target.value };
                                                setLocalConfig({ ...localConfig, filters: newFilters });
                                            }}
                                            className="w-full p-1.5 bg-gray-700 rounded text-xs"
                                            disabled={!filter.field}
                                        >
                                            <option value="">Select Value</option>
                                            {getUniqueValues(filter.field).map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                        <button 
                                            onClick={() => {
                                                const newFilters = (chartConfig.filters || []).filter(f => f.id !== filter.id);
                                                setLocalConfig({ ...localConfig, filters: newFilters });
                                            }}
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                                            title="Remove filter"
                                        >
                                            <RemoveIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    const newFilter: KPIFilter = { id: Date.now().toString(), field: '', value: '' };
                                    const newFilters = [...(chartConfig.filters || []), newFilter];
                                    setLocalConfig({ ...localConfig, filters: newFilters });
                                }}
                                className="mt-2 w-full text-sm text-blue-300 hover:bg-blue-500/10 p-2 rounded-md transition-colors"
                            >
                                + Add Filter
                            </button>
                        </div>
                    </>
                );
            }
            case 'table': {
                const tableConfig = localConfig as TableWidgetConfig;
                const handleColumnToggle = (header: string) => {
                    setLocalConfig(prev => {
                        const currentTableConfig = prev as TableWidgetConfig;
                        const currentColumns = currentTableConfig.columns;
                        const newColumns = currentColumns.includes(header)
                            ? currentColumns.filter(c => c !== header)
                            : [...currentColumns, header];
                        return { ...currentTableConfig, columns: newColumns };
                    });
                };

                return (
                    <>
                        <div>
                            <label className="text-sm text-gray-400">Columns to Display</label>
                            <div className="mt-1 p-2 bg-gray-900/50 rounded-md max-h-40 overflow-y-auto space-y-1">
                                {headers.map(h => (
                                    <label key={h} className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={tableConfig.columns.includes(h)}
                                            onChange={() => handleColumnToggle(h)}
                                            className="h-4 w-4 text-teal-400 bg-gray-600 rounded border-gray-500 focus:ring-teal-300"
                                        />
                                        <span>{h}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Number of Rows</label>
                            <input
                                type="number"
                                value={tableConfig.rowCount}
                                onChange={e => setLocalConfig({ ...localConfig, rowCount: parseInt(e.target.value, 10) || 10 })}
                                className="w-full p-2 bg-gray-700 rounded mt-1"
                                min="1"
                                max="100"
                            />
                        </div>
                    </>
                );
            }
            case 'image': {
                const imgConfig = localConfig as ImageWidgetConfig;
                const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setLocalConfig(prev => ({ ...prev, src: reader.result as string } as ImageWidgetConfig));
                        };
                        reader.readAsDataURL(file);
                    }
                };
                return (
                    <>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full p-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-center">
                            Upload Image
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                        {imgConfig.src && <img src={imgConfig.src} alt="preview" className="mt-2 max-h-40 w-auto mx-auto rounded"/>}
                        <div>
                            <label className="text-sm text-gray-400">Image Fit</label>
                            <select value={imgConfig.fit} onChange={e => setLocalConfig({...localConfig, fit: e.target.value as any})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="contain">Contain</option>
                                <option value="cover">Cover</option>
                                <option value="fill">Fill</option>
                                <option value="scale-down">Scale Down</option>
                            </select>
                        </div>
                    </>
                )
            }
            case 'stats': {
                const statsConfig = localConfig as StatsWidgetConfig;
                const handleVariableToggle = (variable: string) => {
                    setLocalConfig(prev => {
                        const currentStatsConfig = prev as StatsWidgetConfig;
                        const newVariables = currentStatsConfig.variables.includes(variable)
                            ? currentStatsConfig.variables.filter(v => v !== variable)
                            : [...currentStatsConfig.variables, variable];
                        return { ...currentStatsConfig, variables: newVariables };
                    });
                };
                return (
                    <div>
                        <label className="text-sm text-gray-400">Select Variables</label>
                        <div className="mt-1 p-2 bg-gray-900/50 rounded-md max-h-60 overflow-y-auto space-y-1">
                            {headers.map(h => (
                                <label key={h} className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={statsConfig.variables.includes(h)} onChange={() => handleVariableToggle(h)} className="h-4 w-4 text-teal-400 bg-gray-600 rounded border-gray-500 focus:ring-teal-300"/>
                                    <span>{h}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            }
            case 'embeddedChart': {
                 const sourceItems = (localConfig as EmbeddedChartWidgetConfig).sourceView === 'pivotTable' 
                    ? pivotReports.filter(Boolean).map(r => ({id: r.id, name: r.name})) 
                    : [{id: 'chart1', name: 'Chart 1'}, {id: 'chart2', name: 'Chart 2'}];

                return <>
                    <div>
                        <label className="text-sm text-gray-400">Source View</label>
                        <select value={(localConfig as EmbeddedChartWidgetConfig).sourceView || ''} onChange={e => setLocalConfig({...localConfig, sourceView: e.target.value as any, sourceId: null})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            <option value="">Select View</option>
                            <option value="visualizations">Visualizations</option>
                            <option value="pivotTable">Pivot Tables</option>
                        </select>
                    </div>
                    { (localConfig as EmbeddedChartWidgetConfig).sourceView &&
                        <div>
                            <label className="text-sm text-gray-400">Source Item ID</label>
                            <select value={(localConfig as EmbeddedChartWidgetConfig).sourceId || ''} onChange={e => setLocalConfig({...localConfig, sourceId: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                                <option value="">Select Item</option>
                                {sourceItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                    }
                </>
            };
            case 'pivotTableSummary': {
                return (
                    <div>
                        <label className="text-sm text-gray-400">Source Pivot Report</label>
                        <select value={(localConfig as PivotTableSummaryWidgetConfig).sourceId || ''} onChange={e => setLocalConfig({...localConfig, sourceId: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1">
                            <option value="">Select Pivot Report</option>
                            {pivotReports.filter(Boolean).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                )
            };
            default: return <p>This widget type cannot be configured yet.</p>;
        }
    };
    
    const handleSave = () => { onSave(localConfig); };

    return (
        <div className="dashboard-modal-overlay" onClick={onClose}>
            <div className="dashboard-modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-100 mb-4">Configure Widget: {widget.title}</h3>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm text-gray-400">Widget Title</label>
                        <input type="text" value={localConfig.title} onChange={e => setLocalConfig({...localConfig, title: e.target.value})} className="w-full p-2 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-400">Font Family</label>
                            <select value={localConfig.fontFamily || ''} onChange={e => setLocalConfig({...localConfig, fontFamily: e.target.value})} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm">
                                <option value="">Default (Segoe UI)</option>
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="'Courier New', monospace">Courier New</option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="Verdana, sans-serif">Verdana</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Font Size (px)</label>
                            <input type="number" value={localConfig.fontSize || ''} onChange={e => setLocalConfig({...localConfig, fontSize: e.target.value ? parseInt(e.target.value, 10) : undefined})} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm" placeholder="Default"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">Accent Color</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {DASHBOARD_CHART_COLORS.map(c => (
                                <button key={c} onClick={() => setLocalConfig({...localConfig, color: c})}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${localConfig.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    aria-label={`Select color ${c}`}
                                />
                            ))}
                        </div>
                    </div>
                    {renderConfigOptions()}
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500">Save</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW CALCULATOR MODAL ---
const CalculatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    if (!isOpen) return null;

    const handleButtonClick = (value: string) => {
        if (result && !['+', '-', '*', '/'].includes(value)) {
            setInput(value);
            setResult('');
        } else {
            setInput(prev => prev + value);
        }
    };

    const calculateResult = () => {
        try {
            // Using a safe evaluation method
            const calculatedResult = new Function('return ' + input)();
            setResult(String(calculatedResult));
        } catch (error) {
            setResult('Error');
        }
    };

    const clearInput = () => {
        setInput('');
        setResult('');
    };

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+'
    ];

    return (
        <div className="dashboard-modal-overlay" onClick={onClose}>
            <div className="dashboard-modal-content w-full max-w-xs" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-100 mb-4 text-center">Calculator</h3>
                <div className="bg-gray-900/50 p-4 rounded-lg text-right mb-4 border border-gray-700">
                    <div className="text-gray-400 text-sm h-6 truncate">{input || '0'}</div>
                    <div className="text-white text-3xl font-bold h-10 truncate">{result || (input.endsWith('=') ? '' : '')}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={clearInput} className="col-span-4 p-3 bg-red-600/50 hover:bg-red-500/50 text-white rounded-lg transition-colors text-lg font-bold">C</button>
                    {buttons.map(btn => (
                        <button
                            key={btn}
                            onClick={() => (btn === '=' ? calculateResult() : handleButtonClick(btn))}
                            className={`p-3 rounded-lg transition-colors text-lg font-bold
                                ${['/', '*', '-', '+', '='].includes(btn)
                                    ? 'bg-purple-600/50 hover:bg-purple-500/50 text-purple-200'
                                    : 'bg-gray-700/50 hover:bg-gray-600/50 text-white'
                                }`}
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FilterBar: React.FC<{ filters: KPIFilter[], onRemove: (id: string) => void, onClearAll: () => void }> = ({ filters, onRemove, onClearAll }) => {
    if (filters.length === 0) return null;
    return (
        <Panel className="!p-3 mb-4">
            <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-semibold text-gray-400">Active Filters:</span>
                {filters.map(filter => (
                    <div key={filter.id} className="flex items-center gap-2 bg-purple-600/50 text-purple-200 text-xs font-medium pl-3 pr-2 py-1 rounded-full">
                        <span>{filter.field}: <strong>{filter.value}</strong></span>
                        <button onClick={() => onRemove(filter.id)} className="hover:text-white p-0.5 hover:bg-purple-500/50 rounded-full">
                            <CloseIcon className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
                <button onClick={onClearAll} className="ml-auto text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 hover:bg-red-500/10 rounded-md">
                    Clear All
                </button>
            </div>
        </Panel>
    );
}

export const DashboardView: React.FC = () => {
    const { dashboardWidgets, setDashboardWidgets, fileHeaders, tableData, pivotReports, visualizationState } = useContext(DataContext);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [widgetToConfigure, setWidgetToConfigure] = useState<DashboardWidget | null>(null);
    const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const resizeStart = useRef<{x: number, y: number, w: number, h: number, id: string} | null>(null);
    const dashboardContainerRef = useRef<HTMLDivElement>(null);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<KPIFilter[]>([]);

    const addFilter = useCallback((field: string, value: string) => {
        setActiveFilters(prev => {
            if (prev.some(f => f.field === field && f.value === value)) {
                return prev;
            }
            return [...prev, { id: `${field}-${value}-${Date.now()}`, field, value }];
        });
    }, []);

    const removeFilter = (id: string) => {
        setActiveFilters(prev => prev.filter(f => f.id !== id));
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
    };
    
    const handleWidgetConfigure = (id: string) => {
        const widget = dashboardWidgets.find(w => w.id === id);
        if (widget) {
            setWidgetToConfigure(widget);
            setIsConfigModalOpen(true);
        }
    };
    
    const handleAddWidget = (type: WidgetType) => {
        const newWidget: DashboardWidget = {
            id: `${type}-${Date.now()}`,
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            x: (dashboardWidgets.length * 4) % 12,
            y: Infinity, // This will stack it at the bottom
            w: 4,
            h: 3,
            type: type,
        } as DashboardWidget; // A bit of a cheat, but we fill specifics below

        switch(type) {
            case 'kpi': (newWidget as KPIWidgetConfig).valueField = null; (newWidget as KPIWidgetConfig).aggregator = 'sum'; break;
            case 'bar': case 'line': case 'pie': (newWidget as ChartWidgetConfig).xAxisField = null; (newWidget as ChartWidgetConfig).yAxisFields = []; (newWidget as ChartWidgetConfig).aggregator = 'sum'; break;
            case 'table': (newWidget as TableWidgetConfig).columns = []; (newWidget as TableWidgetConfig).rowCount = 10; break;
            case 'embeddedChart': (newWidget as EmbeddedChartWidgetConfig).sourceView = null; (newWidget as EmbeddedChartWidgetConfig).sourceId = null; break;
            case 'pivotTableSummary': (newWidget as PivotTableSummaryWidgetConfig).sourceId = null; break;
            case 'image': (newWidget as ImageWidgetConfig).src = null; (newWidget as ImageWidgetConfig).fit = 'contain'; break;
            case 'stats': (newWidget as StatsWidgetConfig).variables = []; break;
            case 'gauge': (newWidget as GaugeWidgetConfig).valueField = null; (newWidget as GaugeWidgetConfig).aggregator = 'sum'; (newWidget as GaugeWidgetConfig).minValue=0; (newWidget as GaugeWidgetConfig).maxValue=100; break;
        }

        setDashboardWidgets(prev => [...prev, newWidget]);
    };
    
    const handleSaveWidgetConfig = (config: DashboardWidget) => {
        setDashboardWidgets(prev => prev.map(w => w.id === config.id ? config : w));
        setIsConfigModalOpen(false);
        setWidgetToConfigure(null);
    };

    const handleRemoveWidget = (e: ReactMouseEvent<HTMLButtonElement>, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this widget?")) {
            setDashboardWidgets(prev => prev.filter(w => w.id !== id));
        }
    };
    
    const handleDownloadWidget = (id: string, title: string) => {
        const widgetEl = document.getElementById(`widget-content-${id}`);
        if(widgetEl) downloadElementAsHTML(widgetEl, `${title}.html`);
    };

    const handleExportDashboard = useCallback(() => {
        if (gridRef.current) {
            const dashboardClone = gridRef.current.cloneNode(true) as HTMLElement;
            
            // Remove edit-mode-specific elements and classes from the clone for a clean export
            dashboardClone.querySelectorAll('.widget-resize-handle').forEach(el => el.remove());
            dashboardClone.querySelectorAll('.widget-wrapper').forEach(el => {
                el.classList.remove('edit-mode');
                el.removeAttribute('draggable'); // Also remove draggable attribute
            });
            dashboardClone.querySelectorAll('.widget-header').forEach(el => {
                el.classList.remove('widget-header-drag-handle');
            });
            
            downloadElementAsHTML(dashboardClone, 'MasYun_Dashboard.html');
        } else {
            alert('Could not export dashboard. The container element was not found.');
        }
    }, []);

    const onDragStart = (e: DragEvent, id: string) => {
        setDraggedWidgetId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: DragEvent, id: string) => {
        e.preventDefault();
        if (draggedWidgetId && draggedWidgetId !== id) {
            setDragOverId(id);
        }
    };

    const onDragLeave = () => setDragOverId(null);

    const onDrop = (e: DragEvent, dropId: string) => {
        e.preventDefault();
        if (draggedWidgetId && draggedWidgetId !== dropId) {
            setDashboardWidgets(prev => {
                const dragIndex = prev.findIndex(w => w.id === draggedWidgetId);
                const dropIndex = prev.findIndex(w => w.id === dropId);
                const newWidgets = [...prev];
                const [draggedItem] = newWidgets.splice(dragIndex, 1);
                newWidgets.splice(dropIndex, 0, draggedItem);
                return newWidgets;
            });
        }
        setDraggedWidgetId(null);
        setDragOverId(null);
    };
    
    const startResize = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        const widget = dashboardWidgets.find(w => w.id === id);
        if(!widget) return;
        e.stopPropagation();
        resizeStart.current = { x: e.clientX, y: e.clientY, w: widget.w, h: widget.h, id };
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
    };

    const handleResize = useCallback((e: MouseEvent) => {
        if (!resizeStart.current || !gridRef.current) return;
        
        const gridRect = gridRef.current.getBoundingClientRect();
        const columnWidth = gridRect.width / 12;
        const rowHeight = 100 + 24; // 100px height + 24px gap
        
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        const dw = Math.round(dx / columnWidth);
        const dh = Math.round(dy / rowHeight);

        let newW = Math.max(1, resizeStart.current.w + dw);
        let newH = Math.max(1, resizeStart.current.h + dh);

        setDashboardWidgets(prev => prev.map(w => w.id === resizeStart.current!.id ? {...w, w: newW, h: newH} : w));
    }, []);

    const stopResize = useCallback(() => {
        resizeStart.current = null;
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
    }, [handleResize]);
    
    const hasData = tableData.length > 0;

    return (
        <div className="space-y-6" ref={dashboardContainerRef}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportDashboard} className="px-4 py-2 text-sm font-semibold bg-green-700 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"><DownloadIcon className="w-4 h-4" /> Export as HTML</button>
                    <button onClick={() => setIsCalculatorOpen(true)} className="px-4 py-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-2"><CalculatorIcon className="w-4 h-4" /> Calculator</button>
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 ${isEditMode ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'}`}><EditIcon className="w-4 h-4" /> {isEditMode ? 'Done Editing' : 'Edit Layout'}</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2" disabled={!hasData}><AddIcon className="w-4 h-4" /> Add Widget</button>
                </div>
            </div>
            
            <FilterBar filters={activeFilters} onRemove={removeFilter} onClearAll={clearAllFilters} />

            {hasData ? (
                <div ref={gridRef} className="dashboard-grid">
                    {dashboardWidgets.map((widget) => (
                        <div key={widget.id} 
                             className={`widget-wrapper ${isEditMode ? 'edit-mode' : ''} ${draggedWidgetId === widget.id ? 'dragging' : ''} ${dragOverId === widget.id ? 'drag-over' : ''}`}
                             style={{ gridColumn: `span ${widget.w}`, gridRow: `span ${widget.h}` }}
                             draggable={isEditMode}
                             onDragStart={(e) => onDragStart(e, widget.id)}
                             onDragOver={(e) => onDragOver(e, widget.id)}
                             onDragLeave={onDragLeave}
                             onDrop={(e) => onDrop(e, widget.id)}
                        >
                            <Panel className="relative !p-4">
                                <div className={`widget-header ${isEditMode ? 'widget-header-drag-handle' : ''}`}>
                                    <h3 className="text-md font-semibold text-gray-200 truncate pr-2">
                                        {widget.title}
                                    </h3>
                                    <div className="widget-controls">
                                         <button onClick={() => handleDownloadWidget(widget.id, widget.title)} className="widget-control-button"><DownloadIcon className="w-4 h-4"/></button>
                                         <button onClick={() => handleWidgetConfigure(widget.id)} className="widget-control-button"><ConfigIcon className="w-4 h-4"/></button>
                                         <button onClick={(e) => handleRemoveWidget(e, widget.id)} className="widget-control-button"><RemoveIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <div id={`widget-content-${widget.id}`} className="widget-content" style={{
                                    fontFamily: widget.fontFamily || 'inherit',
                                    fontSize: widget.fontSize ? `${widget.fontSize}px` : 'inherit',
                                }}>
                                    {widget.type === 'kpi' && <KPIWidget config={widget as KPIWidgetConfig} onConfigure={handleWidgetConfigure} activeFilters={activeFilters} />}
                                    {['bar', 'line', 'pie'].includes(widget.type) && <ChartWidget config={widget as ChartWidgetConfig} onConfigure={handleWidgetConfigure} activeFilters={activeFilters} onAddFilter={addFilter} />}
                                    {widget.type === 'table' && <TableWidget config={widget as TableWidgetConfig} onConfigure={handleWidgetConfigure} />}
                                    {widget.type === 'embeddedChart' && <EmbeddedChartWidget config={widget as EmbeddedChartWidgetConfig} onConfigure={handleWidgetConfigure} activeFilters={activeFilters} onAddFilter={addFilter} />}
                                    {widget.type === 'pivotTableSummary' && <PivotTableSummaryWidget config={widget as PivotTableSummaryWidgetConfig} onConfigure={handleWidgetConfigure} />}
                                    {widget.type === 'image' && <ImageWidget config={widget as ImageWidgetConfig} onConfigure={handleWidgetConfigure} />}
                                    {widget.type === 'stats' && <StatsWidget config={widget as StatsWidgetConfig} onConfigure={handleWidgetConfigure} activeFilters={activeFilters} />}
                                    {widget.type === 'gauge' && <GaugeWidget config={widget as GaugeWidgetConfig} onConfigure={handleWidgetConfigure} activeFilters={activeFilters} />}
                                </div>
                                {isEditMode && <div onMouseDown={(e) => startResize(e, widget.id)} className="widget-resize-handle"></div>}
                            </Panel>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-800/50 rounded-lg">
                    <h2 className="text-2xl font-semibold text-gray-300">Welcome to Your Dashboard</h2>
                    <p className="mt-2 text-gray-400">Upload data to start adding and configuring widgets.</p>
                </div>
            )}
            
            <AddWidgetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddWidget={handleAddWidget} />
            {isConfigModalOpen && widgetToConfigure && <ConfigureWidgetModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} widget={widgetToConfigure} onSave={handleSaveWidgetConfig} headers={fileHeaders} />}
            <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
        </div>
    );
};
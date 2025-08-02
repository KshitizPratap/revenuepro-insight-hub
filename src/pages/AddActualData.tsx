
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useReportingDataStore } from '@/stores/reportingDataStore';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePeriodSelector } from '@/components/DatePeriodSelector';
import { TargetSection } from '@/components/TargetSection';
import { PeriodType, FieldValue } from '@/types';
import { reportingFields } from '@/utils/constant';
import { calculateReportingFields } from '@/utils/page-utils/actualDataUtils';
import { handleInputDisable } from '@/utils/page-utils/compareUtils';
import { getDefaultValues, processTargetData } from '@/utils/page-utils/targetUtils';
import { getWeekInfo } from '@/utils/weekLogic';
import { IWeeklyTarget } from '@/service/targetService';
import { useUserStore } from '@/stores/userStore';

export const AddActualData = () => {
  const { reportingData, targetData, getReportingData, upsertReportingData, isLoading, error } = useReportingDataStore();
  const { toast } = useToast();
  const { selectedUserId } = useUserStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<PeriodType>('weekly');

  const [fieldValues, setFieldValues] = useState<FieldValue>({});
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const [prevValues, setPrevValues] = useState<FieldValue>({});

  // Use processed target data from store (single API)
  const processedTargetData = useMemo(() => {
    if (!targetData) return undefined;
    return processTargetData(targetData);
  }, [targetData]);

  const selectedWeek = format(selectedDate, 'yyyy-MM-dd');

  // Helper function to get default values for reporting fields
  const getReportingDefaultValues = useCallback((): FieldValue => {
    const defaults: FieldValue = {};
    Object.values(reportingFields).forEach((section: any) => {
      section.forEach((field: any) => {
        if (field.fieldType === "input" && field.defaultValue !== undefined) {
          defaults[field.value] = field.defaultValue;
        }
      });
    });
    return defaults;
  }, []);

  React.useEffect(() => {
    let startDate: string, endDate: string, queryType: string;

    if (period === 'weekly') {
      const weekInfo = getWeekInfo(selectedDate);
      startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
      endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');
      queryType = 'weekly';
    } else if (period === 'monthly') {
      startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      queryType = 'monthly';
    } else {
      startDate = format(startOfYear(selectedDate), 'yyyy-MM-dd');
      endDate = format(endOfYear(selectedDate), 'yyyy-MM-dd');
      queryType = 'yearly';
    }
    getReportingData(startDate, endDate, queryType);
  }, [selectedDate, period, selectedUserId, getReportingData]);

React.useEffect(() => {
  if (reportingData && Array.isArray(reportingData)) {
    const newValues = { ...getReportingDefaultValues() };
    
    reportingData.forEach(data => {
      if (!data) return;
      
      // Process each field from the actual data
      Object.keys(data).forEach(key => {
        // Skip metadata fields
        if (key !== 'userId' && key !== 'startDate' && key !== 'endDate' && 
            key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== '__v') {
          
          // Sum up the values (for monthly data with multiple weeks)
          newValues[key] = (newValues[key] || 0) + (data[key] || 0);
        }
      });
    });

    setFieldValues(newValues);
    setLastChanged(null);
    setPrevValues(newValues);
    
  } else {
    // If no data, set to defaults
    const defaults = getReportingDefaultValues();
    setFieldValues(defaults);
    setLastChanged(null);
    setPrevValues(defaults);
  }
}, [reportingData]);


  const calculatedValues = useMemo(() => {
    // For Add Actual Data, use target revenue for budget calculation
    const combinedValues = {
      ...fieldValues, // User input (actual revenue, etc.)
      com: processedTargetData?.com || 0, // Use target com percentage
      targetRevenue: processedTargetData?.revenue || 0, // Add target revenue
    };
    
    return calculateReportingFields(combinedValues);
  }, [fieldValues, processedTargetData]);

  // Calculate disable logic for AddActualData page
  const disableLogic = useMemo(() => 
    handleInputDisable(period, selectedDate, null, 'addActualData'), 
    [period, selectedDate]
  );

  const { isDisabled, disabledMessage } = disableLogic;

  const handleInputChange = useCallback((fieldName: string, value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      value = 0;
    }
    
    const validatedValue = Math.max(0, value);
    
    setLastChanged(fieldName);
    setPrevValues(calculatedValues);
    
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: validatedValue
    }));
  }, [calculatedValues]);

  // Helper to get all input field names from reportingFields
  const getInputFieldNames = useCallback(() => {
    const inputNames: string[] = [];
    Object.values(reportingFields).forEach(section => {
      section.forEach(field => {
        if (field.fieldType === 'input') {
          inputNames.push(field.value);
        }
      });
    });
    return inputNames;
  }, []);

  const handleSave = useCallback(async () => {
    const weekInfo = getWeekInfo(selectedDate);
    const startDate = format(weekInfo.weekStart, 'yyyy-MM-dd');
    const endDate = format(weekInfo.weekEnd, 'yyyy-MM-dd');

    const inputFieldNames = getInputFieldNames();
    const inputData: { [key: string]: number | undefined } = {};
    inputFieldNames.forEach(name => {
      inputData[name] = fieldValues[name];
    });

    const dataToSave = {
      startDate: startDate,
      endDate: endDate,
      ...inputData
    };

    try {
      await upsertReportingData(dataToSave);
      toast({
        title: "✅ Data Saved Successfully!",
        description: `Week of ${format(new Date(startDate), 'MMM dd, yyyy')} has been updated.`,
      });
    } catch (e) {
      toast({
        title: "❌ Error Saving Data",
        description: error || 'An error occurred while saving.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, fieldValues, upsertReportingData, toast, getInputFieldNames, error]);

  const getWeekRange = (mondayDate: string) => {
    const monday = new Date(mondayDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${format(monday, 'MMM dd')} - ${format(sunday, 'MMM dd, yyyy')}`;
  };

  const isExistingData = Array.isArray(reportingData) && reportingData.some(data => data && data.startDate === selectedWeek);

  const isHighlighted = useCallback((fieldName: string) => {
    if (!lastChanged) return false;
    return prevValues[fieldName] !== calculatedValues[fieldName];
  }, [lastChanged, prevValues, calculatedValues]);

  const handleDatePeriodChange = useCallback((date: Date, period: PeriodType) => {
    setSelectedDate(date);
    setPeriod(period);
  }, []);

  const getSectionFields = useCallback((sectionKey: keyof typeof reportingFields) => {
    return reportingFields[sectionKey];
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="leading-[130%] text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Weekly Reporting
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-10 mt-2">
              Enter your weekly performance metrics for tracking and analysis
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-8">
          <DatePeriodSelector
            initialDate={selectedDate}
            initialPeriod={period}
            onChange={handleDatePeriodChange}
            buttonText="Save Report"
            onButtonClick={handleSave}
            allowedPeriods={['weekly']}
            disableLogic={disableLogic}
          />
        </div>

        {/* Reporting Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <TargetSection
            sectionKey="targets"
            title="Performance"
            icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-green-50/50 to-blue-50/50"
            fields={getSectionFields('targets')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showTarget={true}
          />

          <TargetSection
            sectionKey="budgetReport"
            title="Budget Report"
            icon={<DollarSign className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-blue-50/50 to-purple-50/50"
            fields={getSectionFields('budgetReport')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showTarget={true}
          />

          <TargetSection
            sectionKey="targetReport"
            title="Target Report"
            icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
            gradientClass="bg-gradient-to-r from-green-50/50 to-blue-50/50"
            fields={getSectionFields('targetReport')}
            fieldValues={fieldValues}
            calculatedValues={calculatedValues}
            onInputChange={handleInputChange}
            isHighlighted={isHighlighted}
            period={period}
            selectedDate={selectedDate}
            isDisabled={isDisabled}
            disabledMessage={disabledMessage}
            targetValues={processedTargetData}
            showTarget={true}
          />
        </div>
      </div>
    </div>
  );
};

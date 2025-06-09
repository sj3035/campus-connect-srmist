
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StepperProps {
  currentStep: number;
  steps: {
    number: number;
    title: string;
  }[];
}

const CreateEventStepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex flex-col items-center mb-8">
      {/* Circles and connecting lines */}
      <div className="relative flex justify-center items-center mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep === step.number
                  ? 'bg-srmist-blue text-white'
                  : currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {currentStep > step.number ? '✓' : step.number}
            </div>
            
            {/* Line between steps (except for last step) */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 transition-colors ${
                  currentStep > step.number
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Step titles below circles - properly aligned */}
      <div className="relative flex justify-center items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Title aligned with circle */}
            <div className="w-10 flex justify-center">
              <span
                className={`text-xs text-center ${
                  currentStep === step.number
                    ? 'text-srmist-blue font-medium'
                    : currentStep > step.number
                    ? 'text-green-500 font-medium'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.title}
              </span>
            </div>
            
            {/* Spacer between titles (except for last step) */}
            {index < steps.length - 1 && (
              <div className="w-16" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateEventStepper;

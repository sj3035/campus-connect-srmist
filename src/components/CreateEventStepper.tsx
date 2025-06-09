
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
    <div className="flex justify-center items-center space-x-8 mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-col items-center">
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
          
          {/* Step title below circle */}
          <span
            className={`text-xs mt-2 text-center ${
              currentStep === step.number
                ? 'text-srmist-blue font-medium'
                : currentStep > step.number
                ? 'text-green-500 font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {step.title}
          </span>
          
          {/* Line between steps (except for last step) */}
          {index < steps.length - 1 && (
            <div
              className={`absolute h-0.5 w-16 top-5 transition-colors ${
                currentStep > step.number
                  ? 'bg-green-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              style={{
                left: `${(index + 1) * 120 - 40}px`,
                zIndex: -1,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default CreateEventStepper;

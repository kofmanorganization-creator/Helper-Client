import React from 'react';

interface BookingStepperProps {
  currentStep: number;
}

const steps = ['Service', 'Détails', 'Horaire', 'Paiement'];

const BookingStepper: React.FC<BookingStepperProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between px-4">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted ? 'bg-primary-500 border-primary-500' : ''}
                  ${isActive ? 'bg-primary-500/20 border-primary-500' : ''}
                  ${!isCompleted && !isActive ? 'bg-slate-700 border-slate-600' : ''}
                `}
              >
                <span className={`font-bold ${isActive || isCompleted ? 'text-white' : 'text-slate-400'}`}>
                  {isCompleted ? '✓' : stepNumber}
                </span>
              </div>
              <p className={`text-xs mt-2 font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{label}</p>
            </div>
            {stepNumber < steps.length && (
              <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${isCompleted ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BookingStepper;

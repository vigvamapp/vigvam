import {
  FC,
  createContext,
  useMemo,
  useContext,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useAtom } from "jotai";
import { atomWithURLHash } from "lib/navigation";

export type AllSteps<T = string> = [T, () => ReactNode][];

export type StepsContext = {
  fallbackStep: string;
  stateRef: React.MutableRefObject<Record<string, any>>;
  navigateToStep: (stepId: string) => void;
};

export const stepsContext = createContext<StepsContext | null>(null);

export type StepsProviderProps = {
  namespace: string;
  steps: AllSteps;
  fallback: string;
  children?: (props: { children: ReactNode; step: string }) => ReactNode;
};

export const StepsProvider: FC<StepsProviderProps> = ({
  namespace,
  steps,
  fallback,
  children,
}) => {
  const stepsAtom = useMemo(
    () => atomWithURLHash(`${namespace}_step`, fallback),
    [namespace, fallback]
  );

  const [step, setStep] = useAtom(stepsAtom);

  const stepsObj = useMemo(() => Object.fromEntries(steps), [steps]);
  const stepNode = useMemo(() => {
    const node = stepsObj[step]();
    return children ? children({ children: node, step }) : node;
  }, [stepsObj, step, children]);

  const stateRef = useRef<Record<string, any>>({});

  const navigateToStep = useCallback(
    (toSet: string, replace = false) => {
      setStep([toSet, replace && "replace"]);
    },
    [setStep]
  );

  const value = useMemo(
    () => ({
      fallbackStep: fallback,
      stateRef,
      navigateToStep,
    }),
    [fallback, navigateToStep]
  );

  return (
    <stepsContext.Provider value={value}>{stepNode}</stepsContext.Provider>
  );
};

export function useSteps() {
  const ctx = useContext(stepsContext);
  if (!ctx) throw new Error("Wrap steps with <StepsProvider />");
  return ctx;
}

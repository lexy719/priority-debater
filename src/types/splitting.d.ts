declare module "splitting" {
  type SplittingTarget = HTMLElement | NodeListOf<HTMLElement> | string;
  interface SplittingOptions {
    target?: SplittingTarget;
    by?: "chars" | "words" | "lines" | string;
    key?: string | null;
  }
  function Splitting(options?: SplittingOptions): unknown[];
  export default Splitting;
}

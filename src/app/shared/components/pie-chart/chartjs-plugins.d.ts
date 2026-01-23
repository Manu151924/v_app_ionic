import 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends keyof ChartTypeRegistry> {
    centerText?: {
      value?: number | string;
    };
  }
}

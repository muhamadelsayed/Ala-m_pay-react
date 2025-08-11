const Formatter = {
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  },
  formatCurrency: (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  }
};
export default Formatter;
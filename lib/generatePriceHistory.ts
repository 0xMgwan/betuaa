// Generate realistic price history for markets
export function generatePriceHistory(
  currentYesPrice: number,
  currentNoPrice: number,
  points: number = 30
): { time: string; yes: number; no: number }[] {
  const history: { time: string; yes: number; no: number }[] = [];
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  
  // Start from a lower price and trend towards current
  let yesPrice = currentYesPrice / 100 - 0.2 - Math.random() * 0.1;
  yesPrice = Math.max(0.1, Math.min(0.9, yesPrice));
  
  for (let i = 0; i < points; i++) {
    const monthIndex = Math.floor((i / points) * months.length);
    const time = months[monthIndex];
    
    // Add some realistic volatility
    const volatility = (Math.random() - 0.5) * 0.05;
    const trend = ((currentYesPrice / 100) - yesPrice) / (points - i);
    
    yesPrice += trend + volatility;
    yesPrice = Math.max(0.05, Math.min(0.95, yesPrice));
    
    const noPrice = 1 - yesPrice;
    
    history.push({
      time,
      yes: yesPrice,
      no: noPrice,
    });
  }
  
  // Ensure last point matches current price
  history[history.length - 1] = {
    time: 'Jan',
    yes: currentYesPrice / 100,
    no: currentNoPrice / 100,
  };
  
  return history;
}

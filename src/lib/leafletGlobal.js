// leaflet.markercluster cần biến toàn cục L
import L from 'leaflet';

if (typeof window !== 'undefined') window.L = window.L || L;
export default L;

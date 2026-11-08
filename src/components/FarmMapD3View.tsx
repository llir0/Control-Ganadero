import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Info,
  Droplets,
  Trees,
  Scale,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  X,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Tag,
  MapPin,
  Flame,
  HelpCircle,
  Download,
  Filter,
  Syringe,
  FileDown,
} from 'lucide-react';
import { PasturePaddock, Animal } from '../types';
import { getStoredPastures, saveStoredPasture, rotatePastureBatch } from '../lib/storage';

interface FarmMapD3ViewProps {
  animals: Animal[];
  onRefreshData?: () => void;
  onOpenAnimalDetail?: (animal: Animal) => void;
  onOpenMangaForPaddock?: (paddockId: string) => void;
  onOpenBatchTreatmentForPaddock?: (paddock: PasturePaddock) => void;
  onOpenValuation?: () => void;
  onOpenExportReports?: () => void;
}

export type MapMetricMode = 'heads_density' | 'ugm_density' | 'rotation_status' | 'biomass';

export const FarmMapD3View: React.FC<FarmMapD3ViewProps> = ({
  animals,
  onRefreshData,
  onOpenAnimalDetail,
  onOpenMangaForPaddock,
  onOpenBatchTreatmentForPaddock,
  onOpenValuation,
  onOpenExportReports,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pastures, setPastures] = useState<PasturePaddock[]>(getStoredPastures());
  const [metricMode, setMetricMode] = useState<MapMetricMode>('heads_density');
  const [selectedPaddock, setSelectedPaddock] = useState<PasturePaddock | null>(null);
  const [hoveredPaddock, setHoveredPaddock] = useState<PasturePaddock | null>(null);
  const [hoveredAnimal, setHoveredAnimal] = useState<{ animal: Animal; x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Layer Visibility Toggles
  const [showWaterTroughs, setShowWaterTroughs] = useState(true);
  const [showTrees, setShowTrees] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showAnimalDots, setShowAnimalDots] = useState(true);
  const [showHeatGlow, setShowHeatGlow] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Purpose filter
  const [purposeFilter, setPurposeFilter] = useState<string>('TODOS');

  // Quick rotation modal from map
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [targetPaddockId, setTargetPaddockId] = useState('');
  const [batchMoveName, setBatchMoveName] = useState('Lote Seleccionado');

  // Refresh pastures when local data updates
  const reloadData = () => {
    setPastures(getStoredPastures());
    if (onRefreshData) onRefreshData();
  };

  // Filter active animals
  const activeAnimals = useMemo(() => {
    return animals.filter((a) => {
      if (a.status !== 'ACT') return false;
      if (purposeFilter === 'TODOS') return true;
      return a.purpose === purposeFilter;
    });
  }, [animals, purposeFilter]);

  // Associate animals to paddocks
  // Matching strategy:
  // 1. By animal.paddockId
  // 2. By paddock.currentOccupantBatch matching animal.batchNumber or corral purpose
  const paddockAnimalsMap = useMemo(() => {
    const map: Record<string, Animal[]> = {};
    pastures.forEach((p) => {
      map[p.id] = [];
    });

    activeAnimals.forEach((animal) => {
      // Direct match
      if (animal.paddockId && map[animal.paddockId]) {
        map[animal.paddockId].push(animal);
        return;
      }

      // Match by occupant batch name
      const matchedPaddock = pastures.find(
        (p) =>
          p.status === 'Ocupado' &&
          p.currentOccupantBatch &&
          ((animal.batchNumber && p.currentOccupantBatch.toLowerCase().includes(animal.batchNumber.toLowerCase())) ||
            (animal.purpose === 'CEBA' && p.currentOccupantBatch.toLowerCase().includes('ceba')) ||
            (animal.purpose === 'LECHE' && p.currentOccupantBatch.toLowerCase().includes('leche') || p.currentOccupantBatch.toLowerCase().includes('ordeño')) ||
            (animal.purpose === 'CRIA' && p.currentOccupantBatch.toLowerCase().includes('cría')) ||
            (animal.purpose === 'REPRODUCTOR' && p.currentOccupantBatch.toLowerCase().includes('reproductor')))
      );

      if (matchedPaddock) {
        map[matchedPaddock.id].push(animal);
      } else {
        // Fallback default distribution to first occupied paddock if any
        const firstOccupied = pastures.find((p) => p.status === 'Ocupado');
        if (firstOccupied) {
          map[firstOccupied.id].push(animal);
        }
      }
    });

    return map;
  }, [pastures, activeAnimals]);

  // Computed metrics per paddock
  const paddockMetrics = useMemo(() => {
    return pastures.map((paddock) => {
      const assigned = paddockAnimalsMap[paddock.id] || [];
      const headsCount = assigned.length;
      const totalWeightKg = assigned.reduce((sum, a) => sum + (a.currentWeightKg || 450), 0);
      const ugm = totalWeightKg / 450; // 1 UGM = 450 kg
      const headsDensity = paddock.areaHectares > 0 ? headsCount / paddock.areaHectares : 0;
      const ugmDensity = paddock.areaHectares > 0 ? ugm / paddock.areaHectares : 0;

      // Recommended capacity threshold is usually 1.2 - 2.0 UGM/Ha depending on grass
      const maxRecommendedUGM = paddock.areaHectares * 1.8;
      const capacityUtilizationPct = maxRecommendedUGM > 0 ? Math.round((ugm / maxRecommendedUGM) * 100) : 0;

      return {
        ...paddock,
        assignedAnimals: assigned,
        headsCount,
        ugm: Math.round(ugm * 10) / 10,
        headsDensity: Math.round(headsDensity * 10) / 10,
        ugmDensity: Math.round(ugmDensity * 100) / 100,
        capacityUtilizationPct,
        totalBiomassTon: Math.round(((paddock.estimatedBiomassKgPerM2 * 10000 * paddock.areaHectares) / 1000) * 10) / 10,
      };
    });
  }, [pastures, paddockAnimalsMap]);

  // Farm Totals
  const totalAreaHa = pastures.reduce((acc, p) => acc + p.areaHectares, 0);
  const totalOccupiedPaddocks = pastures.filter((p) => p.status === 'Ocupado').length;
  const totalAnimalsOnPasture = (Object.values(paddockAnimalsMap) as Animal[][]).reduce<number>(
    (acc, list) => acc + list.length,
    0
  );
  const globalFarmDensity = totalAreaHa > 0 ? (totalAnimalsOnPasture / totalAreaHa).toFixed(2) : '0';
  const totalFarmUGM = activeAnimals.reduce((acc, a) => acc + (a.currentWeightKg || 450) / 450, 0);
  const globalUgmDensity = totalAreaHa > 0 ? (totalFarmUGM / totalAreaHa).toFixed(2) : '0';

  // D3 Color Scales
  const headsDensityColorScale = useMemo(() => {
    // 0 = resting/empty (slate green), mid = optimal (emerald), high = heavy (amber), severe = red (overgrazing)
    return d3
      .scaleLinear<string>()
      .domain([0, 0.5, 1.5, 3.0, 5.0])
      .range(['#132e26', '#059669', '#10b981', '#f59e0b', '#ef4444'])
      .clamp(true);
  }, []);

  const ugmDensityColorScale = useMemo(() => {
    // 0 = 0 UGM/Ha (dark forest), 1.0 = optimal, 2.0 = full capacity, 3.0+ = critical
    return d3
      .scaleLinear<string>()
      .domain([0, 0.6, 1.4, 2.2, 3.5])
      .range(['#0f2820', '#10b981', '#06b6d4', '#f59e0b', '#ef4444'])
      .clamp(true);
  }, []);

  const biomassColorScale = useMemo(() => {
    // 1.0 Kg/m² (low biomass) to 3.5+ Kg/m² (luxuriant lush grass)
    return d3
      .scaleLinear<string>()
      .domain([1.0, 1.8, 2.6, 3.5])
      .range(['#422006', '#854d0e', '#15803d', '#10b981'])
      .clamp(true);
  }, []);

  const getPaddockFillColor = (paddockMetric: (typeof paddockMetrics)[0]) => {
    if (metricMode === 'heads_density') {
      if (paddockMetric.headsCount === 0) return '#10261f';
      return headsDensityColorScale(paddockMetric.headsDensity);
    }
    if (metricMode === 'ugm_density') {
      if (paddockMetric.ugm === 0) return '#0d221b';
      return ugmDensityColorScale(paddockMetric.ugmDensity);
    }
    if (metricMode === 'biomass') {
      return biomassColorScale(paddockMetric.estimatedBiomassKgPerM2);
    }
    // Rotation Status Mode
    switch (paddockMetric.status) {
      case 'Ocupado':
        return '#0284c7'; // Vibrant Sky/Cyan Blue
      case 'Listo para Pastoreo':
        return '#10b981'; // Emerald Green
      case 'En Descanso':
        return '#d97706'; // Amber / Gold
      case 'En Mantenimiento':
        return '#7c3aed'; // Purple
      default:
        return '#334155';
    }
  };

  // D3 Zoom handler ref to trigger programmatic zoom buttons
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Setup D3 Visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1000;
    const height = 700;

    // Clear previous drawings
    svg.selectAll('*').remove();

    // Create defs for filters and gradients
    const defs = svg.append('defs');

    // Subtle drop shadow filter for parcels and markers
    const filter = defs.append('filter').attr('id', 'parcel-shadow').attr('x', '-10%').attr('y', '-10%').attr('width', '130%').attr('height', '130%');
    filter.append('feDropShadow').attr('dx', '0').attr('dy', '4').attr('stdDeviation', '6').attr('flood-color', '#000000').attr('flood-opacity', '0.6');

    // Glow filter for heat and active grazing
    const glow = defs.append('filter').attr('id', 'heat-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // River water gradient
    const riverGrad = defs.append('linearGradient').attr('id', 'riverGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    riverGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0284c7').attr('stop-opacity', '0.85');
    riverGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', '0.95');

    // Soil and farm road pattern
    const roadPattern = defs
      .append('pattern')
      .attr('id', 'dirtRoadPattern')
      .attr('width', '10')
      .attr('height', '10')
      .attr('patternUnits', 'userSpaceOnUse');
    roadPattern.append('rect').attr('width', '10').attr('height', '10').attr('fill', '#453224');
    roadPattern.append('circle').attr('cx', '5').attr('cy', '5').attr('r', '1').attr('fill', '#5c4533');

    // Grass texture pattern
    const grassPattern = defs
      .append('pattern')
      .attr('id', 'grassPattern')
      .attr('width', '24')
      .attr('height', '24')
      .attr('patternUnits', 'userSpaceOnUse');
    grassPattern.append('rect').attr('width', '24').attr('height', '24').attr('fill', '#071712');
    grassPattern.append('line').attr('x1', '4').attr('y1', '20').attr('x2', '6').attr('y2', '10').attr('stroke', '#0d2b22').attr('stroke-width', '1.2');
    grassPattern.append('line').attr('x1', '12').attr('y1', '22').attr('x2', '14').attr('y2', '8').attr('stroke', '#0d2b22').attr('stroke-width', '1.2');
    grassPattern.append('line').attr('x1', '18').attr('y1', '18').attr('x2', '20').attr('y2', '12').attr('stroke', '#0d2b22').attr('stroke-width', '1.2');

    // Topography lines pattern
    const topoGrad = defs.append('radialGradient').attr('id', 'farmVignette').attr('cx', '50%').attr('cy', '50%').attr('r', '70%');
    topoGrad.append('stop').attr('offset', '40%').attr('stop-color', '#091c16').attr('stop-opacity', '0.3');
    topoGrad.append('stop').attr('offset', '100%').attr('stop-color', '#020617').attr('stop-opacity', '0.95');

    // Root Group with Zoom & Pan
    const zoomGroup = svg.append('g').attr('id', 'zoom-container');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 5])
      .translateExtent([
        [-200, -200],
        [width + 300, height + 300],
      ])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // LAYER 1: Base Terrain Background & Finca Border
    const terrainLayer = zoomGroup.append('g').attr('class', 'terrain-layer');

    // Farm perimeter boundary polygon
    const farmBoundaryPoints: [number, number][] = [
      [20, 20],
      [970, 20],
      [970, 680],
      [20, 680],
    ];

    terrainLayer
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#grassPattern)');

    terrainLayer
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#farmVignette)')
      .style('pointer-events', 'none');

    // Topographical elevation contour curves (aesthetic organic lines)
    const topoLayer = zoomGroup.append('g').attr('class', 'topography-contours').attr('opacity', 0.25).style('pointer-events', 'none');
    topoLayer
      .append('path')
      .attr(
        'd',
        'M 50 150 Q 250 80 500 130 T 950 100 M 50 320 Q 300 240 600 300 T 950 260 M 50 500 Q 280 430 550 490 T 950 460'
      )
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '4,8');

    // LAYER 2: River / Quebrada El Cañito (flowing from NW along W & S boundaries)
    const riverLayer = zoomGroup.append('g').attr('class', 'river-layer');
    const riverPathD =
      'M 25 10 C 20 120, 35 250, 25 380 C 18 470, 32 580, 35 675 C 150 685, 450 675, 650 682 C 780 678, 890 682, 970 675';

    // River buffer shoreline
    riverLayer
      .append('path')
      .attr('d', riverPathD)
      .attr('fill', 'none')
      .attr('stroke', '#064e3b')
      .attr('stroke-width', '24')
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.7);

    // River main water body
    riverLayer
      .append('path')
      .attr('d', riverPathD)
      .attr('fill', 'none')
      .attr('stroke', 'url(#riverGradient)')
      .attr('stroke-width', '14')
      .attr('stroke-linecap', 'round')
      .attr('filter', 'url(#parcel-shadow)');

    // River water label
    riverLayer
      .append('text')
      .attr('x', 24)
      .attr('y', 330)
      .attr('transform', 'rotate(-90, 24, 330)')
      .attr('fill', '#7dd3fc')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('letter-spacing', '3px')
      .attr('opacity', 0.8)
      .text('QUEBRADA EL CAÑITO (AGUA NATURAL)');

    // LAYER 3: Farm Internal Roads & Arreo Corridors (Caminos de Servidumbre)
    if (showRoads) {
      const roadsLayer = zoomGroup.append('g').attr('class', 'roads-layer');

      // Central artery road from gate through Casco to all paddocks
      const roadPath1 = 'M 960 360 L 650 360 L 330 360 L 210 360 L 40 360';
      const roadPath2 = 'M 330 40 L 330 650';
      const roadPath3 = 'M 640 40 L 640 650';

      [roadPath1, roadPath2, roadPath3].forEach((roadPath) => {
        // Road outer ditch
        roadsLayer
          .append('path')
          .attr('d', roadPath)
          .attr('fill', 'none')
          .attr('stroke', '#292524')
          .attr('stroke-width', '16')
          .attr('stroke-linecap', 'round')
          .attr('opacity', 0.8);

        // Road main track
        roadsLayer
          .append('path')
          .attr('d', roadPath)
          .attr('fill', 'none')
          .attr('stroke', '#78593f')
          .attr('stroke-width', '10')
          .attr('stroke-linecap', 'round')
          .attr('stroke-dasharray', '8,3');
      });

      // Road intersection markings
      roadsLayer
        .append('text')
        .attr('x', 800)
        .attr('y', 350)
        .attr('fill', '#a8a29e')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('letter-spacing', '1.5px')
        .text('CALLEJÓN DE ARREO PRINCIPAL');
    }

    // LAYER 4: Headquarters / Casco de la Finca & Central Manga
    const hqLayer = zoomGroup.append('g').attr('class', 'hq-center-layer');

    // Central Headquarters polygon
    const hqPoints: [number, number][] = [
      [220, 260],
      [630, 260],
      [630, 460],
      [220, 460],
    ];

    hqLayer
      .append('polygon')
      .attr('points', hqPoints.map((p) => p.join(',')).join(' '))
      .attr('fill', '#1c1917')
      .attr('stroke', '#78716c')
      .attr('stroke-width', '2')
      .attr('stroke-dasharray', '6,4')
      .attr('filter', 'url(#parcel-shadow)');

    // HQ Label
    hqLayer
      .append('rect')
      .attr('x', 360)
      .attr('y', 270)
      .attr('width', 130)
      .attr('height', 22)
      .attr('rx', 6)
      .attr('fill', '#0c0a09')
      .attr('stroke', '#eab308')
      .attr('stroke-width', '1');

    hqLayer
      .append('text')
      .attr('x', 425)
      .attr('y', 285)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fde047')
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .attr('letter-spacing', '1px')
      .text('CENTRO OPERATIVO');

    // Mini Corrals within HQ (Corral A, B, C, Manga de Manejo)
    const subStructures = [
      { name: 'Corral A (Maternidad)', x: 240, y: 300, w: 90, h: 65, color: '#0369a1' },
      { name: 'Corral B (Ceba)', x: 345, y: 300, w: 95, h: 65, color: '#15803d' },
      { name: 'Corral C (Ordeño)', x: 455, y: 300, w: 95, h: 65, color: '#b45309' },
      { name: 'Manga de Manejo & Báscula', x: 240, y: 380, w: 220, h: 32, color: '#9333ea' },
      { name: 'Bodega de Silos & Almacén', x: 475, y: 380, w: 140, h: 65, color: '#475569' },
    ];

    subStructures.forEach((sub) => {
      const g = hqLayer.append('g');
      g.append('rect')
        .attr('x', sub.x)
        .attr('y', sub.y)
        .attr('width', sub.w)
        .attr('height', sub.h)
        .attr('rx', 4)
        .attr('fill', '#262626')
        .attr('stroke', sub.color)
        .attr('stroke-width', '1.5');

      g.append('text')
        .attr('x', sub.x + sub.w / 2)
        .attr('y', sub.y + sub.h / 2 + 3)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f5f5f4')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .text(sub.name);
    });

    // LAYER 5: Paddocks (Potreros) Polygonal Mosaic & Heat Choropleth
    const paddocksLayer = zoomGroup.append('g').attr('class', 'paddocks-layer');

    paddockMetrics.forEach((paddock) => {
      const pts = paddock.polygonPoints;
      if (!pts || pts.length === 0) return;

      const fillColor = getPaddockFillColor(paddock);
      const isSelected = selectedPaddock?.id === paddock.id;
      const isHovered = hoveredPaddock?.id === paddock.id;

      const paddockGroup = paddocksLayer
        .append('g')
        .attr('class', `paddock-polygon-group-${paddock.id}`)
        .style('cursor', 'pointer');

      // Heat Glow Underlay for high density or active grazing
      if (showHeatGlow && (paddock.headsDensity > 2.0 || paddock.status === 'Ocupado')) {
        paddockGroup
          .append('polygon')
          .attr('points', pts.map((p) => p.join(',')).join(' '))
          .attr('fill', paddock.status === 'Ocupado' ? '#38bdf8' : '#ef4444')
          .attr('opacity', 0.22)
          .attr('filter', 'url(#heat-glow)');
      }

      // Main Paddock Parcel Polygon
      paddockGroup
        .append('polygon')
        .attr('points', pts.map((p) => p.join(',')).join(' '))
        .attr('fill', fillColor)
        .attr('fill-opacity', isHovered ? 0.95 : 0.85)
        .attr('stroke', isSelected ? '#38bdf8' : isHovered ? '#f8fafc' : '#047857')
        .attr('stroke-width', isSelected ? 4 : isHovered ? 3 : 2)
        .attr('stroke-linejoin', 'round')
        .attr('filter', 'url(#parcel-shadow)')
        .on('mouseenter', () => {
          setHoveredPaddock(paddock);
        })
        .on('mouseleave', () => {
          setHoveredPaddock(null);
        })
        .on('click', () => {
          setSelectedPaddock(paddock);
        });

      // Fence Posts along the polygon perimeter
      pts.forEach((pt, i) => {
        paddockGroup
          .append('circle')
          .attr('cx', pt[0])
          .attr('cy', pt[1])
          .attr('r', 3)
          .attr('fill', '#f59e0b')
          .attr('stroke', '#451a03')
          .attr('stroke-width', '1')
          .style('pointer-events', 'none');
      });

      // Gate / Tranquera Node
      if (paddock.gatePoint) {
        const [gx, gy] = paddock.gatePoint;
        const gateG = paddockGroup.append('g').attr('class', 'gate-node').style('pointer-events', 'none');

        gateG
          .append('rect')
          .attr('x', gx - 8)
          .attr('y', gy - 5)
          .attr('width', 16)
          .attr('height', 10)
          .attr('rx', 2)
          .attr('fill', '#b45309')
          .attr('stroke', '#fef08a')
          .attr('stroke-width', '1');

        gateG
          .append('text')
          .attr('x', gx)
          .attr('y', gy + 3)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '7px')
          .attr('font-weight', 'bold')
          .text('🚪');
      }

      // Water Trough (Bebedero / Represa)
      if (showWaterTroughs && paddock.waterPoint) {
        const [wx, wy] = paddock.waterPoint;
        const waterG = paddockGroup.append('g').attr('class', 'water-trough').style('pointer-events', 'none');

        // Animated ripple effect
        waterG
          .append('circle')
          .attr('cx', wx)
          .attr('cy', wy)
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', '1.5')
          .attr('opacity', 0.6);

        waterG
          .append('circle')
          .attr('cx', wx)
          .attr('cy', wy)
          .attr('r', 6)
          .attr('fill', '#0284c7')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', '1.5');
      }

      // Shade Trees (Bosquetes / Sombra Animal)
      if (showTrees && paddock.treePoints) {
        paddock.treePoints.forEach(([tx, ty]) => {
          const treeG = paddockGroup.append('g').attr('class', 'shade-tree').style('pointer-events', 'none');

          // Tree shadow
          treeG
            .append('ellipse')
            .attr('cx', tx + 2)
            .attr('cy', ty + 4)
            .attr('rx', 9)
            .attr('ry', 6)
            .attr('fill', '#022c22')
            .attr('opacity', 0.6);

          // Tree canopy
          treeG
            .append('circle')
            .attr('cx', tx)
            .attr('cy', ty)
            .attr('r', 8)
            .attr('fill', '#065f46')
            .attr('stroke', '#047857')
            .attr('stroke-width', '1');

          treeG
            .append('circle')
            .attr('cx', tx - 2)
            .attr('cy', ty - 2)
            .attr('r', 4)
            .attr('fill', '#10b981')
            .attr('opacity', 0.6);
        });
      }

      // Paddock Center Information Badge
      if (showLabels && paddock.centerPoint) {
        const [cx, cy] = paddock.centerPoint;
        const labelG = paddockGroup
          .append('g')
          .attr('class', 'paddock-center-label')
          .attr('transform', `translate(${cx}, ${cy})`)
          .style('pointer-events', 'none');

        // Badge Container
        labelG
          .append('rect')
          .attr('x', -60)
          .attr('y', -32)
          .attr('width', 120)
          .attr('height', 56)
          .attr('rx', 8)
          .attr('fill', '#091512')
          .attr('fill-opacity', 0.92)
          .attr('stroke', isSelected ? '#38bdf8' : '#1e3a34')
          .attr('stroke-width', '1.5');

        // Code & Name
        labelG
          .append('text')
          .attr('x', 0)
          .attr('y', -18)
          .attr('text-anchor', 'middle')
          .attr('fill', '#a7f3d0')
          .attr('font-size', '9px')
          .attr('font-weight', '900')
          .text(paddock.code);

        labelG
          .append('text')
          .attr('x', 0)
          .attr('y', -7)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '8.5px')
          .attr('font-weight', 'bold')
          .text(paddock.name.length > 18 ? paddock.name.slice(0, 16) + '...' : paddock.name);

        // Dynamic Metric Display according to active mode
        let metricText = '';
        let metricColor = '#38bdf8';

        if (metricMode === 'heads_density') {
          metricText = `${paddock.headsCount} cabezas (${paddock.headsDensity} Cab/Ha)`;
          metricColor = paddock.headsDensity > 2.5 ? '#f87171' : '#34d399';
        } else if (metricMode === 'ugm_density') {
          metricText = `${paddock.ugm} UGM (${paddock.ugmDensity} UGM/Ha)`;
          metricColor = paddock.ugmDensity > 2.0 ? '#fbbf24' : '#38bdf8';
        } else if (metricMode === 'rotation_status') {
          metricText =
            paddock.status === 'Ocupado'
              ? `Ocupado (${paddock.daysInGrazing}d)`
              : `Descanso: ${paddock.currentRestDays}/${paddock.targetRestDays}d`;
          metricColor =
            paddock.status === 'Ocupado'
              ? '#38bdf8'
              : paddock.status === 'Listo para Pastoreo'
              ? '#34d399'
              : '#f59e0b';
        } else if (metricMode === 'biomass') {
          metricText = `${paddock.estimatedBiomassKgPerM2} Kg/m² (${paddock.totalBiomassTon} Ton)`;
          metricColor = '#a3e635';
        }

        labelG
          .append('text')
          .attr('x', 0)
          .attr('y', 7)
          .attr('text-anchor', 'middle')
          .attr('fill', metricColor)
          .attr('font-size', '8px')
          .attr('font-weight', 'black')
          .text(metricText);

        // Area & Grass
        labelG
          .append('text')
          .attr('x', 0)
          .attr('y', 18)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '7.5px')
          .text(`${paddock.areaHectares} Ha • ${paddock.grassType.split(' ')[0]}`);
      }

      // LAYER 6: Animal Scatter Dots (Realistic Bovine Distribution)
      if (showAnimalDots && paddock.assignedAnimals && paddock.assignedAnimals.length > 0) {
        const animalsLayer = zoomGroup.append('g').attr('class', `animals-scatter-${paddock.id}`);
        const count = paddock.assignedAnimals.length;
        const [cx, cy] = paddock.centerPoint || [200, 200];

        paddock.assignedAnimals.forEach((animal, idx) => {
          // Compute pseudo-random but deterministic scatter position around center
          const angle = (idx / count) * 2 * Math.PI + (idx % 3) * 0.4;
          const radius = Math.min(80, 20 + Math.sqrt(idx) * 16 + (idx % 4) * 8);
          const cowX = cx + Math.cos(angle) * radius;
          const cowY = cy + Math.sin(angle) * (radius * 0.75);

          const cowG = animalsLayer
            .append('g')
            .attr('class', `cow-dot-${animal.id}`)
            .attr('transform', `translate(${cowX}, ${cowY})`)
            .style('cursor', 'pointer');

          // Cow shadow
          cowG
            .append('ellipse')
            .attr('cx', 1)
            .attr('cy', 3)
            .attr('rx', 4)
            .attr('ry', 2.5)
            .attr('fill', '#000000')
            .attr('opacity', 0.4);

          // Cow Body Dot
          const cowDot = cowG
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 4.5)
            .attr('fill', animal.purpose === 'CEBA' ? '#38bdf8' : animal.purpose === 'LECHE' ? '#f43f5e' : '#eab308')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', '1.2');

          // Cow head / ear mark
          cowG
            .append('circle')
            .attr('cx', 2)
            .attr('cy', -2)
            .attr('r', 1.8)
            .attr('fill', '#ffffff');

          cowG
            .on('mouseenter', (event) => {
              cowDot.attr('r', 7).attr('stroke', '#fbbf24').attr('stroke-width', 2);
              setHoveredAnimal({ animal, x: event.clientX, y: event.clientY });
            })
            .on('mouseleave', () => {
              cowDot.attr('r', 4.5).attr('stroke', '#ffffff').attr('stroke-width', 1.2);
              setHoveredAnimal(null);
            })
            .on('click', (event) => {
              event.stopPropagation();
              if (onOpenAnimalDetail) {
                onOpenAnimalDetail(animal);
              }
            });
        });
      }
    });

    // LAYER 7: Cartographic Accents (Compass Rose, Scale Bar, Grid Coordinates)
    const cartoLayer = svg.append('g').attr('class', 'cartographic-overlays').style('pointer-events', 'none');

    // Compass Rose (North Arrow) in top-right corner
    const compassG = cartoLayer.append('g').attr('transform', 'translate(950, 45)');
    compassG.append('circle').attr('r', 22).attr('fill', '#091512').attr('stroke', '#1e3a34').attr('stroke-width', '1.5');
    // North Pointer
    compassG.append('polygon').attr('points', '0,-18 5,0 0,-4 -5,0').attr('fill', '#ef4444');
    // South Pointer
    compassG.append('polygon').attr('points', '0,18 5,0 0,4 -5,0').attr('fill', '#94a3b8');
    compassG.append('text').attr('x', 0).attr('y', -7).attr('text-anchor', 'middle').attr('fill', '#ef4444').attr('font-size', '8px').attr('font-weight', '900').text('N');

    // Graphic Scale Bar (Bottom-left corner)
    const scaleBarG = cartoLayer.append('g').attr('transform', 'translate(40, 670)');
    scaleBarG.append('rect').attr('x', -8).attr('y', -16).attr('width', 140).attr('height', 24).attr('rx', 4).attr('fill', '#091512').attr('stroke', '#1e3a34').attr('stroke-width', '1');
    scaleBarG.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 120).attr('y2', 0).attr('stroke', '#ffffff').attr('stroke-width', '3');
    scaleBarG.append('line').attr('x1', 0).attr('y1', -4).attr('x2', 0).attr('y2', 4).attr('stroke', '#ffffff').attr('stroke-width', '2');
    scaleBarG.append('line').attr('x1', 60).attr('y1', -3).attr('x2', 60).attr('y2', 3).attr('stroke', '#ffffff').attr('stroke-width', '2');
    scaleBarG.append('line').attr('x1', 120).attr('y1', -4).attr('x2', 120).attr('y2', 4).attr('stroke', '#ffffff').attr('stroke-width', '2');
    scaleBarG.append('text').attr('x', 0).attr('y', -6).attr('fill', '#cbd5e1').attr('font-size', '7px').attr('font-family', 'monospace').text('0m');
    scaleBarG.append('text').attr('x', 60).attr('y', -6).attr('fill', '#cbd5e1').attr('font-size', '7px').attr('font-family', 'monospace').text('200m');
    scaleBarG.append('text').attr('x', 120).attr('y', -6).attr('fill', '#cbd5e1').attr('font-size', '7px').attr('font-family', 'monospace').text('400m');
  }, [
    paddockMetrics,
    metricMode,
    selectedPaddock,
    hoveredPaddock,
    showWaterTroughs,
    showTrees,
    showRoads,
    showAnimalDots,
    showHeatGlow,
    showLabels,
    headsDensityColorScale,
    ugmDensityColorScale,
    biomassColorScale,
    onOpenAnimalDetail,
  ]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.77);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const handleFocusPaddock = (paddock: PasturePaddock) => {
    if (!svgRef.current || !zoomBehaviorRef.current || !paddock.centerPoint) return;
    const [cx, cy] = paddock.centerPoint;
    const width = 1000;
    const height = 700;
    const scale = 2.0;
    const transform = d3.zoomIdentity
      .translate(width / 2 - cx * scale, height / 2 - cy * scale)
      .scale(scale);

    d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, transform);
    setSelectedPaddock(paddock);
  };

  // Rotation submit
  const handleExecutePaddockRotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaddock || !targetPaddockId) return;

    rotatePastureBatch(selectedPaddock.id, targetPaddockId, batchMoveName, 'Administrador');
    reloadData();
    setIsRotateModalOpen(false);
    setSelectedPaddock(null);
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 overflow-y-auto' : ''}`}>
      {/* Top Header & Farm Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Cartografía Ganadera D3 Pro
              </span>
              <span className="text-xs text-slate-400">Sistema Georreferenciado de Potreros</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Mapa Interactivo de la Finca & Densidad de Pastoreo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-2xl">
              Visualización geoespacial con D3.js: polígonos de potreros, cálculo dinámico de carga animal (Cabezas/Ha & UGM/Ha), biomasa forrajera y rotación holística.
            </p>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Superficie Total</span>
              <span className="text-lg font-black text-white font-mono">{totalAreaHa.toFixed(1)} Ha</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Potreros Ocupados</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {totalOccupiedPaddocks} / {pastures.length}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Carga Finca</span>
              <span className="text-lg font-black text-cyan-400 font-mono">{globalUgmDensity} UGM/Ha</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Hato Activo</span>
              <span className="text-lg font-black text-amber-400 font-mono">{totalAnimalsOnPasture} Cab</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Visualization Modes & Layer Switches */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Metric Mode Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Capa:
          </span>

          <button
            onClick={() => setMetricMode('heads_density')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricMode === 'heads_density'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Densidad (Cab/Ha)
          </button>

          <button
            onClick={() => setMetricMode('ugm_density')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricMode === 'ugm_density'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Carga Animal (UGM/Ha)
          </button>

          <button
            onClick={() => setMetricMode('rotation_status')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricMode === 'rotation_status'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Rotación & Descanso
          </button>

          <button
            onClick={() => setMetricMode('biomass')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              metricMode === 'biomass'
                ? 'bg-lime-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Biomasa & Aforo (Kg/m²)
          </button>
        </div>

        {/* Feature Switches & Zoom Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Layer toggles dropdown/pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowAnimalDots(!showAnimalDots)}
              title="Alternar puntos de ganado"
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                showAnimalDots ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Ganado
            </button>
            <button
              onClick={() => setShowWaterTroughs(!showWaterTroughs)}
              title="Alternar bebederos"
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                showWaterTroughs ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Bebederos
            </button>
            <button
              onClick={() => setShowTrees(!showTrees)}
              title="Alternar árboles de sombra"
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                showTrees ? 'bg-teal-950 text-teal-300 border border-teal-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Árboles
            </button>
            <button
              onClick={() => setShowHeatGlow(!showHeatGlow)}
              title="Alternar resplandor de calor"
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                showHeatGlow ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Calor
            </button>
          </div>

          {/* D3 Zoom Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Acercar (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Alejar (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Restablecer vista centrada"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas Container */}
      <div
        ref={containerRef}
        className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[520px] lg:min-h-[620px]"
      >
        {/* SVG Rendered by D3 */}
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          className="w-full h-full min-h-[520px] lg:min-h-[620px] select-none touch-none"
        />

        {/* Dynamic Map Legend Overlay (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl max-w-xs text-xs space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              Leyenda: {metricMode === 'heads_density' ? 'Densidad (Cab/Ha)' : metricMode === 'ugm_density' ? 'Carga (UGM/Ha)' : metricMode === 'rotation_status' ? 'Estado de Pastoreo' : 'Biomasa Verde (Kg/m²)'}
            </span>
          </div>

          {metricMode === 'heads_density' && (
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#132e26] via-[#10b981] via-[#f59e0b] to-[#ef4444]" />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 Cab/Ha (Vacío)</span>
                <span>1.5 Óptimo</span>
                <span>5.0+ Crítico</span>
              </div>
            </div>
          )}

          {metricMode === 'ugm_density' && (
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#0f2820] via-[#10b981] via-[#06b6d4] via-[#f59e0b] to-[#ef4444]" />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 UGM/Ha</span>
                <span>1.4 Equilibrado</span>
                <span>3.5+ Exceso</span>
              </div>
            </div>
          )}

          {metricMode === 'biomass' && (
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#422006] via-[#854d0e] via-[#15803d] to-[#10b981]" />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1.0 Kg/m² (Bajo)</span>
                <span>2.5 Medio</span>
                <span>3.5+ Abundante</span>
              </div>
            </div>
          )}

          {metricMode === 'rotation_status' && (
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Ocupado (Pastoreo)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Listo p/ Entrar</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>En Descanso</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Mantenimiento</span>
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>🔵 Bebedero con Agua</span>
            <span>🌳 Sombra Natural</span>
          </div>
        </div>

        {/* Hovered Paddock Quick Tooltip (Top-Left of Map) */}
        {hoveredPaddock && (
          <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-xl p-3 shadow-2xl max-w-xs animate-in fade-in text-xs space-y-1 pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-emerald-400 text-[11px]">{hoveredPaddock.code}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  hoveredPaddock.status === 'Ocupado'
                    ? 'bg-blue-500/20 text-blue-300'
                    : hoveredPaddock.status === 'Listo para Pastoreo'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {hoveredPaddock.status}
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">{hoveredPaddock.name}</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300 pt-1">
              <div>
                <span className="text-slate-500 block text-[9px]">Superficie:</span>
                <span className="font-semibold text-white">{hoveredPaddock.areaHectares} Ha</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Pasto:</span>
                <span className="font-semibold text-white truncate block">{hoveredPaddock.grassType.split(' ')[0]}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Carga Animal:</span>
                <span className="font-semibold text-cyan-400">
                  {paddockMetrics.find((p) => p.id === hoveredPaddock.id)?.headsDensity || 0} Cab/Ha
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Aforo Verde:</span>
                <span className="font-semibold text-emerald-400">{hoveredPaddock.estimatedBiomassKgPerM2} Kg/m²</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1">Haz clic para abrir la ficha de control y rotación</p>
          </div>
        )}

        {/* Hovered Cow Tooltip */}
        {hoveredAnimal && (
          <div
            className="fixed z-50 bg-slate-900 border border-amber-500/50 rounded-xl p-2.5 shadow-2xl text-xs space-y-1 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: hoveredAnimal.x, top: hoveredAnimal.y - 12 }}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-300 font-mono">ID: {hoveredAnimal.animal.id}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {hoveredAnimal.animal.purpose}
              </span>
            </div>
            <p className="text-white font-semibold text-[11px]">{hoveredAnimal.animal.name || 'Sin Nombre'}</p>
            <div className="text-[10px] text-slate-300">
              <span>{hoveredAnimal.animal.breed}</span> • <span className="font-bold text-emerald-400">{hoveredAnimal.animal.currentWeightKg} Kg</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Paddock Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          Enfocar Potrero:
        </span>
        {paddockMetrics.map((pad) => (
          <button
            key={pad.id}
            onClick={() => handleFocusPaddock(pad)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedPaddock?.id === pad.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                pad.status === 'Ocupado'
                  ? 'bg-blue-400'
                  : pad.status === 'Listo para Pastoreo'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span>{pad.code}</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">({pad.headsCount} cab)</span>
          </button>
        ))}
      </div>

      {/* Selected Paddock Inspector Modal / Drawer */}
      {selectedPaddock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPaddock(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Compass className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedPaddock.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedPaddock.status === 'Ocupado'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : selectedPaddock.status === 'Listo para Pastoreo'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedPaddock.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">{selectedPaddock.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPaddock.grassType}</p>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Superficie</span>
                <span className="text-lg font-black text-white font-mono">{selectedPaddock.areaHectares} Ha</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Animales en Potrero</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {paddockMetrics.find((p) => p.id === selectedPaddock.id)?.headsCount || 0} Cabezas
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Densidad Carga</span>
                <span className="text-lg font-black text-cyan-400 font-mono">
                  {paddockMetrics.find((p) => p.id === selectedPaddock.id)?.ugmDensity || 0} UGM/Ha
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Biomasa Disponible</span>
                <span className="text-lg font-black text-lime-400 font-mono">{selectedPaddock.estimatedBiomassKgPerM2} Kg/m²</span>
              </div>
            </div>

            {/* Carrying Capacity Progress Bar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Aprovechamiento de Carga Recomendada:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {paddockMetrics.find((p) => p.id === selectedPaddock.id)?.capacityUtilizationPct || 0}% de capacidad
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (paddockMetrics.find((p) => p.id === selectedPaddock.id)?.capacityUtilizationPct || 0) > 100
                      ? 'bg-red-500'
                      : (paddockMetrics.find((p) => p.id === selectedPaddock.id)?.capacityUtilizationPct || 0) > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      paddockMetrics.find((p) => p.id === selectedPaddock.id)?.capacityUtilizationPct || 0
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Capacidad sugerida: 1.8 UGM/Ha</span>
                <span>Fuente de Agua: {selectedPaddock.waterSource}</span>
                <span>Cercado: {selectedPaddock.fencingType}</span>
              </div>
            </div>

            {/* List of Animals Currently in this Paddock */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Listado de Animales Asignados (
                  {paddockMetrics.find((p) => p.id === selectedPaddock.id)?.assignedAnimals.length || 0})
                </h4>
                {selectedPaddock.currentOccupantBatch && (
                  <span className="text-xs text-blue-400 font-semibold">
                    Lote: {selectedPaddock.currentOccupantBatch}
                  </span>
                )}
              </div>

              {paddockMetrics.find((p) => p.id === selectedPaddock.id)?.assignedAnimals.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  Este potrero no tiene animales asignados actualmente (se encuentra en reposo o preparación).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {paddockMetrics
                    .find((p) => p.id === selectedPaddock.id)
                    ?.assignedAnimals.map((animal) => (
                      <div
                        key={animal.id}
                        onClick={() => {
                          if (onOpenAnimalDetail) onOpenAnimalDetail(animal);
                        }}
                        className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center font-mono">
                            {animal.id}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {animal.name || `Animal #${animal.id}`}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {animal.breed} • {animal.purpose}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {animal.currentWeightKg} Kg
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Connected Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                {onOpenMangaForPaddock && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMangaForPaddock(selectedPaddock.id);
                      setSelectedPaddock(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Cargar animales de este potrero en báscula de manga"
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    Pesar en Manga
                  </button>
                )}

                {onOpenBatchTreatmentForPaddock && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenBatchTreatmentForPaddock(selectedPaddock);
                      setSelectedPaddock(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Aplicar vacuna o desparasitante al lote de este potrero"
                  >
                    <Syringe className="w-3.5 h-3.5 text-amber-400" />
                    Tratamiento por Lote
                  </button>
                )}

                {onOpenExportReports && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExportReports();
                      setSelectedPaddock(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Exportar informes clínicos o financieros"
                  >
                    <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                    Exportar PDF
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaddock(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetPaddockId('');
                    setBatchMoveName(selectedPaddock.currentOccupantBatch || `Lote ${selectedPaddock.name}`);
                    setIsRotateModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Rotar Potrero
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Move / Rotate Modal */}
      {isRotateModalOpen && selectedPaddock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              Rotar Ganado desde {selectedPaddock.name}
            </h3>

            <form onSubmit={handleExecutePaddockRotation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Lote a Trasladar</label>
                <input
                  type="text"
                  value={batchMoveName}
                  onChange={(e) => setBatchMoveName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Potrero Destino (Entrará a Pastoreo)
                </label>
                <select
                  value={targetPaddockId}
                  onChange={(e) => setTargetPaddockId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                >
                  <option value="">Seleccione potrero destino</option>
                  {pastures
                    .filter((p) => p.id !== selectedPaddock.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.status} - {p.grassType})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[11px] text-blue-300">
                Al confirmar, el potrero <strong>{selectedPaddock.name}</strong> pasará automáticamente a estado{' '}
                <strong>En Descanso</strong> iniciando su contador biológico de recuperación de pasto.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRotateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  Confirmar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

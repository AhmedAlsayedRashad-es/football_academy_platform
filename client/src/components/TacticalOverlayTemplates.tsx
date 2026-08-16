import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  Target, 
  TrendingUp, 
  Shield,
  Users,
  ArrowRight,
  Circle,
  Plus,
  Minus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OverlayType = "build_up" | "progression" | "finishing" | "defensive_shape" | "pressing" | "custom";

interface TacticalOverlayTemplatesProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function TacticalOverlayTemplates({ videoRef, canvasRef }: TacticalOverlayTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<OverlayType | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);

  const templates = [
    {
      id: "build_up" as OverlayType,
      name: "Build Up Phase",
      description: "Player shapes, overload markers (+1, +2), passing triangles",
      icon: Shield,
      color: "blue",
      elements: [
        "Player position circles",
        "+1 overload indicators",
        "Passing triangle lines",
        "Goalkeeper distribution arrows",
        "Defensive line markers"
      ]
    },
    {
      id: "progression" as OverlayType,
      name: "Progression Phase",
      description: "Line-breaking passes, vertical runs, positional rotations",
      icon: TrendingUp,
      color: "green",
      elements: [
        "Line-breaking pass arrows",
        "Vertical progression markers",
        "Rotation movement paths",
        "Space exploitation zones",
        "Third-man run indicators"
      ]
    },
    {
      id: "finishing" as OverlayType,
      name: "Finishing Phase",
      description: "Attacking patterns, crosses, cut-backs, player traits",
      icon: Target,
      color: "orange",
      elements: [
        "Shot location markers",
        "Cross trajectories",
        "Cut-back arrows",
        "Overlap indicators",
        "Inside cut markers"
      ]
    },
    {
      id: "defensive_shape" as OverlayType,
      name: "Defensive Shape",
      description: "Defensive lines, compactness, zonal coverage",
      icon: Shield,
      color: "red",
      elements: [
        "Defensive line markers",
        "Compactness indicators",
        "Zonal coverage areas",
        "Pressing triggers",
        "Cover shadow zones"
      ]
    },
    {
      id: "pressing" as OverlayType,
      name: "Pressing System",
      description: "Press triggers, intensity zones, trap areas",
      icon: Users,
      color: "purple",
      elements: [
        "Press trigger zones",
        "High intensity areas",
        "Trap formation markers",
        "Pressing direction arrows",
        "Recovery run paths"
      ]
    },
    {
      id: "custom" as OverlayType,
      name: "Custom Overlay",
      description: "Create your own tactical overlay",
      icon: Layers,
      color: "gray",
      elements: [
        "Custom markers",
        "Free-form arrows",
        "Text annotations",
        "Highlight zones",
        "Player labels"
      ]
    }
  ];

  const applyOverlay = (type: OverlayType) => {
    setSelectedTemplate(type);
    setOverlayVisible(true);
    
    // In a real implementation, this would draw on the canvas
    if (canvasRef?.current && videoRef?.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Clear previous overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set opacity
        ctx.globalAlpha = overlayOpacity;
        
        // Draw template-specific overlays
        drawTemplateOverlay(ctx, type, canvas.width, canvas.height);
      }
    }
  };

  const drawTemplateOverlay = (ctx: CanvasRenderingContext2D, type: OverlayType, width: number, height: number) => {
    // Example overlay drawings based on template type
    switch (type) {
      case "build_up":
        // Draw player circles
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; // blue
        ctx.beginPath();
        ctx.arc(width * 0.3, height * 0.5, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw +1 overload marker
        ctx.fillStyle = "rgba(34, 197, 94, 0.8)"; // green
        ctx.font = "bold 16px Arial";
        ctx.fillText("+1", width * 0.3 - 10, height * 0.5 + 5);
        break;
        
      case "progression":
        // Draw line-breaking arrow
        ctx.strokeStyle = "rgba(34, 197, 94, 0.8)"; // green
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width * 0.3, height * 0.6);
        ctx.lineTo(width * 0.6, height * 0.3);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
        ctx.beginPath();
        ctx.moveTo(width * 0.6, height * 0.3);
        ctx.lineTo(width * 0.58, height * 0.32);
        ctx.lineTo(width * 0.59, height * 0.28);
        ctx.fill();
        break;
        
      case "finishing":
        // Draw shot marker
        ctx.fillStyle = "rgba(249, 115, 22, 0.6)"; // orange
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.4, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw cross trajectory
        ctx.strokeStyle = "rgba(249, 115, 22, 0.8)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(width * 0.7, height * 0.7);
        ctx.lineTo(width * 0.85, height * 0.4);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
        
      case "defensive_shape":
        // Draw defensive line
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // red
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.3);
        ctx.lineTo(width * 0.2, height * 0.7);
        ctx.stroke();
        break;
        
      case "pressing":
        // Draw press trigger zone
        ctx.fillStyle = "rgba(168, 85, 247, 0.3)"; // purple
        ctx.fillRect(width * 0.4, height * 0.3, width * 0.2, height * 0.4);
        
        // Draw pressing arrows
        ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(width * 0.35, height * (0.35 + i * 0.15));
          ctx.lineTo(width * 0.45, height * (0.35 + i * 0.15));
          ctx.stroke();
        }
        break;
        
      default:
        break;
    }
  };

  const toggleOverlay = () => {
    setOverlayVisible(!overlayVisible);
    
    if (overlayVisible && canvasRef?.current) {
      // Clear overlay when hiding
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } else if (!overlayVisible && selectedTemplate) {
      // Reapply overlay when showing
      applyOverlay(selectedTemplate);
    }
  };

  const adjustOpacity = (delta: number) => {
    const newOpacity = Math.max(0.1, Math.min(1, overlayOpacity + delta));
    setOverlayOpacity(newOpacity);
    
    // Reapply overlay with new opacity
    if (selectedTemplate && overlayVisible) {
      applyOverlay(selectedTemplate);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Tactical Overlay Templates
            </CardTitle>
            <CardDescription>
              Apply professional tactical overlays to video analysis
            </CardDescription>
          </div>
          {selectedTemplate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustOpacity(-0.1)}
                disabled={overlayOpacity <= 0.1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">
                {Math.round(overlayOpacity * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustOpacity(0.1)}
                disabled={overlayOpacity >= 1}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant={overlayVisible ? "default" : "outline"}
                size="sm"
                onClick={toggleOverlay}
              >
                {overlayVisible ? "Hide" : "Show"} Overlay
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => applyOverlay(template.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className={`h-4 w-4 text-${template.color}-600`} />
                    {template.name}
                    {isSelected && (
                      <Badge variant="default" className="ml-auto text-xs">Active</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                  <ul className="text-xs space-y-0.5">
                    {template.elements.slice(0, 3).map((element, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <Circle className="h-2 w-2 mt-1 flex-shrink-0" />
                        <span>{element}</span>
                      </li>
                    ))}
                    {template.elements.length > 3 && (
                      <li className="text-muted-foreground italic">
                        +{template.elements.length - 3} more...
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Template Details */}
        {selectedTemplate && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Active Overlay: {templates.find(t => t.id === selectedTemplate)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">All Elements:</p>
                <div className="grid grid-cols-2 gap-2">
                  {templates
                    .find(t => t.id === selectedTemplate)
                    ?.elements.map((element, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Circle className="h-2 w-2 text-primary" />
                        <span>{element}</span>
                      </div>
                    ))}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Tip: Use the opacity controls above to adjust overlay visibility. 
                    Toggle overlay on/off to compare with and without annotations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!selectedTemplate && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  How to use Tactical Overlays:
                </p>
                <ol className="space-y-1 text-blue-800 dark:text-blue-200">
                  <li>1. Select a template above that matches your analysis focus</li>
                  <li>2. The overlay will automatically appear on your video</li>
                  <li>3. Adjust opacity using the +/- buttons for better visibility</li>
                  <li>4. Toggle overlay on/off to compare annotated vs clean footage</li>
                  <li>5. Switch between templates to analyze different tactical aspects</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

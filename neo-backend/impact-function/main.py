from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/calculate', methods=['POST'])
def calculate_impact():
    # Use get_json with force=True to parse JSON regardless of Content-Type
    data = request.get_json(force=True) or {}
    
    # Debug: print received data
    print(f"Received data: {data}")

    # Fields from AsteroidTelemetry record
    asteroid_id = data.get('id')
    name = data.get('name')
    distance_km = float(data.get('distanceKm') or 0)
    velocity_kms = float(data.get('velocityKmS') or 0)
    diameter_m = float(data.get('diameterM') or 10)  # Default to 10m if missing
    
    print(f"Parsed: velocity={velocity_kms} km/s, diameter={diameter_m}m")

    # 2. Physics Logic (Simplified)
    # Mass = Volume * Density. Assume spherical rock (density ~3000 kg/m^3)
    radius = diameter_m / 2
    volume = (4/3) * 3.14159 * (radius ** 3)
    mass_kg = volume * 3000

    # Velocity needs to be m/s for Physics formula (KE = 0.5 * m * v^2)
    velocity_ms = velocity_kms * 1000
    kinetic_energy_joules = 0.5 * mass_kg * (velocity_ms ** 2)

    # Convert Joules to Kilotons of TNT (1 Kiloton = 4.184 x 10^12 Joules)
    kilotons = kinetic_energy_joules / (4.184 * (10 ** 12))
    
    print(f"Calculated: mass={mass_kg:.0f}kg, KE={kinetic_energy_joules:.2e}J, energy={kilotons:.2f} kilotons")

    return jsonify({
        "id": asteroid_id,
        "name": name,
        "distanceKm": distance_km,
        "asteroid_size": f"{diameter_m} meters",
        "impact_energy": f"{kilotons:.2f} Kilotons of TNT",
        "status": "CATASTROPHIC" if kilotons > 1000 else "MANAGEABLE"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
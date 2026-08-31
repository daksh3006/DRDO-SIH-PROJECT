import numpy as np
import matplotlib.pyplot as plt
from MATERIALS import MATERIALS
from WEATHER import AMBIENT_TEMPERATURE, SOLAR_IRRADIANCE


def simulate_shelter(
    wall_area,
    roof_area,
    window_area,
    wall_thickness,
    roof_thickness,
    wall_material,
    roof_material,
    thermal_capacity=100000.0,
    initial_temperature=None
):
       
    wall = MATERIALS[wall_material]
    roof = MATERIALS[roof_material]
    
    wall_k = wall["k"]
    roof_k = roof["k"]
    
    wall_U = wall_k / wall_thickness
    roof_U = roof_k / roof_thickness
    
    window_U = 2.5
    
    roof_absorptivity = 0.8
    window_transmissivity = 0.7
    
    #setup
    hours = np.arange(24)
    indoor_temperature = np.zeros(24)
    heat_loss_his = np.zeros(24)
    solar_gain_his = np.zeros(24)
    
    if initial_temperature is None:
        indoor_temperature[0] = AMBIENT_TEMPERATURE[0]
    else:
        indoor_temperature[0] = initial_temperature
    
    dt = 3600
    
    
        
    for t in range(23):

        Tin = indoor_temperature[t]
        Tout = AMBIENT_TEMPERATURE[t]
        solar = SOLAR_IRRADIANCE[t]

        # Wall heat loss
        wall_loss = (
            wall_U
            * wall_area
            * (Tin - Tout)
        )

        # Roof heat loss
        roof_loss = (
            roof_U
            * roof_area
            * (Tin - Tout)
        )

        # Window heat loss
        window_loss = (
            window_U
            * window_area
            * (Tin - Tout)
        )

        # Solar gain through roof
        solar_gain_roof = (
            solar
            * roof_area
            * roof_absorptivity
        )

        # Solar gain through windows
        solar_gain_window = (
            solar
            * window_area
            * window_transmissivity
        )

        # Total values
        total_solar_gain = (
            solar_gain_roof
            + solar_gain_window
        )

        total_heat_loss = (
            wall_loss
            + roof_loss
            + window_loss
        )

        # Net heat flow
        net_heat = (
            total_solar_gain
            - total_heat_loss
        )

        # Temperature change
        temperature_change = (
            net_heat
            * dt
            / thermal_capacity
        )

        # Next temperature
        indoor_temperature[t + 1] = (
            Tin
            + temperature_change
        )

        # Store values
        heat_loss_his[t] = total_heat_loss
        solar_gain_his[t] = total_solar_gain

    return (
        hours,
        indoor_temperature,
        heat_loss_his,
        solar_gain_his
    )
        
    
    
if __name__ == "__main__":

    results = simulate_shelter(
        wall_area=40.0,
        roof_area=20.0,
        window_area=4.0,

        wall_thickness=0.10,
        roof_thickness=0.10,

        wall_material="Brick",
        roof_material="Insulated Panel",

        thermal_capacity=100000.0
    )

    hours = results[0]
    indoor_temperature = results[1]
    heat_loss = results[2]
    solar_gain = results[3]

    # --------------------------------------------------------
    # Print results
    # --------------------------------------------------------

    print("\n24-HOUR SHELTER SIMULATION")
    print("-" * 65)

    for hour in range(24):

        print(
            f"{hour:02d}:00 | "
            f"Ambient: {AMBIENT_TEMPERATURE[hour]:6.1f} °C | "
            f"Indoor: {indoor_temperature[hour]:6.1f} °C | "
            f"Solar: {SOLAR_IRRADIANCE[hour]:5.0f} W/m²"
        )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print("\nSUMMARY")
    print("-" * 40)

    print(
        f"Minimum indoor temperature: "
        f"{np.min(indoor_temperature):.2f} °C"
    )

    print(
        f"Maximum indoor temperature: "
        f"{np.max(indoor_temperature):.2f} °C"
    )

    print(
        f"Average indoor temperature: "
        f"{np.mean(indoor_temperature):.2f} °C"
    )

    print(
        f"Total solar energy: "
        f"{np.sum(solar_gain) * 3600 / 3_600_000:.2f} kWh"
    )

    print(
        f"Total heat loss: "
        f"{np.sum(heat_loss) * 3600 / 3_600_000:.2f} kWh"
    )

    # --------------------------------------------------------
    # Plot temperature
    # --------------------------------------------------------

    plt.figure(figsize=(10, 5))

    plt.plot(
        hours,
        AMBIENT_TEMPERATURE,
        label="Ambient Temperature"
    )

    plt.plot(
        hours,
        indoor_temperature,
        label="Indoor Temperature"
    )

    plt.xlabel("Hour")
    plt.ylabel("Temperature (°C)")
    plt.title("24-Hour Shelter Thermal Simulation")

    plt.legend()
    plt.grid()

    plt.tight_layout()
    plt.show()

    
